import { PrismaClient, Gender, RoomStatus, RoomType } from '@prisma/client';
import 'dotenv/config';

/**
 * Seeding helper that assigns every existing student to a gender-appropriate
 * hostel room. Each room has a capacity of 3 students.
 *
 * Usage:
 *   npm run db:seed:allocations
 *
 * It is safe to re-run: previous allocations are cleared and recreated.
 */

export const DEFAULT_ACADEMIC_YEAR = '2025-2026';
export const DEFAULT_SEMESTER = 1;
/** 100% of students are assigned to a room. */
export const DEFAULT_ALLOCATION_RATE = 1;
const BEDS_PER_ROOM = 3;

interface HostelPlan {
  name: string;
  description: string;
  address: string;
  block: string;
  amenities: string[];
}

const HOSTEL_PLANS: Record<Gender, HostelPlan> = {
  MALE: {
    name: 'Sunrise Boys Hostel',
    description: 'Premium hostel for male students with modern amenities.',
    address: 'Block A, North Campus, University Road',
    block: 'A',
    amenities: ['WiFi', 'Gym', 'Cafeteria', 'Laundry', 'CCTV'],
  },
  FEMALE: {
    name: 'Moonrise Girls Hostel',
    description: 'Safe and comfortable hostel for female students.',
    address: 'Block B, South Campus, University Road',
    block: 'B',
    amenities: ['WiFi', 'Common Room', 'Cafeteria', 'Laundry', 'Security Guard'],
  },
  OTHER: {
    name: 'Equality Hostel',
    description: 'Inclusive hostel for students of all genders.',
    address: 'Block C, East Campus, University Road',
    block: 'C',
    amenities: ['WiFi', 'Common Room', 'Cafeteria', 'Laundry', 'Security'],
  },
};

export interface AllocationSeedOptions {
  adminId?: string;
  academicYear?: string;
  semester?: number;
  allocationRate?: number;
  clearExisting?: boolean;
}

export interface AllocationSeedSummary {
  totalStudents: number;
  allocated: number;
  unassigned: number;
  byGender: Record<string, { total: number; allocated: number; unassigned: number }>;
  roomsUsed: number;
}

/** Generates room numbers like A-101, A-102, A-201 ... for a block. */
function buildRoomPlan(block: string, roomCount: number) {
  const rooms: Array<{
    roomNumber: string;
    floor: number;
    roomType: RoomType;
    pricePerMonth: number;
    amenities: string[];
  }> = [];

  let floor = 1;
  while (rooms.length < roomCount) {
    for (let index = 1; index <= 4 && rooms.length < roomCount; index++) {
      const isAc = floor % 2 === 1;
      rooms.push({
        roomNumber: `${block}-${floor}${String(index).padStart(2, '0')}`,
        floor,
        roomType: isAc ? RoomType.AC : RoomType.NON_AC,
        pricePerMonth: isAc ? (floor === 1 ? 12000 : 15000) : (floor === 2 ? 7000 : 6000),
        amenities: isAc
          ? ['AC', 'Attached Bathroom', 'Study Table', 'WiFi']
          : ['Fan', 'Shared Bathroom', 'Study Table', 'WiFi'],
      });
    }
    floor++;
  }

  return rooms;
}

async function ensureHostel(prisma: PrismaClient, gender: Gender) {
  const plan = HOSTEL_PLANS[gender];
  const byName = await prisma.hostel.findUnique({ where: { name: plan.name } });
  if (byName) return byName;

  const byGender = await prisma.hostel.findFirst({ where: { gender } });
  if (byGender) return byGender;

  return prisma.hostel.create({
    data: {
      name: plan.name,
      description: plan.description,
      gender,
      address: plan.address,
      amenities: [...plan.amenities],
      totalRooms: 0,
      availableRooms: 0,
    },
  });
}

async function ensureRooms(
  prisma: PrismaClient,
  hostelId: string,
  block: string,
  requiredBeds: number
) {
  const existing = await prisma.room.findMany({ where: { hostelId } });
  const existingNumbers = new Set(existing.map((room) => room.roomNumber));
  let capacity = existing.reduce((sum, room) => sum + room.totalBeds, 0);

  // Create exactly as many 3-bed rooms as needed to house every student.
  const requiredCapacity = requiredBeds;
  const candidatePlan = buildRoomPlan(
    block,
    Math.ceil(requiredCapacity / BEDS_PER_ROOM) + 2
  );

  for (const room of candidatePlan) {
    if (capacity >= requiredCapacity) break;
    if (existingNumbers.has(room.roomNumber)) continue;

    await prisma.room.create({
      data: {
        hostelId,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        totalBeds: BEDS_PER_ROOM,
        occupiedBeds: 0,
        status: RoomStatus.AVAILABLE,
        pricePerMonth: room.pricePerMonth,
        amenities: [...room.amenities],
      },
    });
    existingNumbers.add(room.roomNumber);
    capacity += BEDS_PER_ROOM;
  }

  return prisma.room.findMany({
    where: { hostelId },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
}

/**
 * Picks `count` indexes to leave unassigned, biased toward newer records
 * (students are ordered oldest -> newest). Sampling the newest 80% with an
 * even stride produces a mix of assigned/unassigned rows on each page.
 */
function pickUnassignedIndexes(total: number, count: number): Set<number> {
  const result = new Set<number>();
  if (count <= 0) return result;
  if (count >= total) {
    for (let i = 0; i < total; i++) result.add(i);
    return result;
  }

  const windowSize = Math.max(count, Math.ceil(total * 0.8));
  const start = total - windowSize;
  const stride = windowSize / count;

  for (let i = 0; i < count; i++) {
    let index = start + Math.min(windowSize - 1, Math.round(i * stride));
    while (result.has(index) && index < total - 1) index++;
    if (result.has(index)) {
      const fallback = Array.from({ length: total }, (_, candidate) => total - 1 - candidate)
        .find((candidate) => !result.has(candidate));
      if (fallback === undefined) break;
      index = fallback;
    }
    result.add(index);
  }

  return result;
}

export async function seedAllocations(
  prisma: PrismaClient,
  options: AllocationSeedOptions = {}
): Promise<AllocationSeedSummary> {
  const academicYear = options.academicYear ?? DEFAULT_ACADEMIC_YEAR;
  const semester = options.semester ?? DEFAULT_SEMESTER;
  const allocationRate = options.allocationRate ?? DEFAULT_ALLOCATION_RATE;
  const clearExisting = options.clearExisting ?? true;

  const admin = options.adminId
    ? await prisma.admin.findUnique({ where: { id: options.adminId } })
    : await prisma.admin.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!admin) {
    throw new Error('No admin account found. Run `npm run db:seed` first.');
  }

  const students = await prisma.student.findMany({
    orderBy: [{ createdAt: 'asc' }, { studentId: 'asc' }],
    select: { id: true, fullName: true, gender: true },
  });

  if (students.length === 0) {
    throw new Error('No students found. Run `npm run db:seed` first.');
  }

  if (clearExisting) {
    await prisma.allocation.deleteMany({});
    await prisma.allocationRequest.deleteMany({});
  }
  await prisma.room.updateMany({
    data: { occupiedBeds: 0, totalBeds: BEDS_PER_ROOM, status: RoomStatus.AVAILABLE },
  });

  const summary: AllocationSeedSummary = {
    totalStudents: students.length,
    allocated: 0,
    unassigned: 0,
    byGender: {},
    roomsUsed: 0,
  };

  const genders: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];

  for (const gender of genders) {
    const group = students.filter((student) => student.gender === gender);
    if (group.length === 0) continue;

    const target = Math.round(group.length * allocationRate);
    const targetUnassigned = group.length - target;

    // Default rate is 100% so every student receives a room. When a lower rate
    // is supplied, newer records are sampled and left without an allocation.
    const unassignedIndexes = pickUnassignedIndexes(group.length, targetUnassigned);
    const selected = group.filter((_, index) => !unassignedIndexes.has(index));
    const unassigned = group.filter((_, index) => unassignedIndexes.has(index));

    const hostel = await ensureHostel(prisma, gender);
    const block = HOSTEL_PLANS[gender].block;
    const rooms = await ensureRooms(prisma, hostel.id, block, target);

    let cursor = 0;
    let roomsUsed = 0;

    for (const room of rooms) {
      if (cursor >= selected.length) break;

      const occupants = Math.min(room.totalBeds, selected.length - cursor);
      for (let bed = 0; bed < occupants; bed++) {
        const student = selected[cursor++];

        const request = await prisma.allocationRequest.create({
          data: {
            studentId: student.id,
            hostelId: hostel.id,
            preferredRoomType: room.roomType,
            preferredFloor: room.floor,
            status: 'APPROVED',
            academicYear,
            semester,
            processedById: admin.id,
            processedAt: new Date('2025-07-15'),
          },
        });

        await prisma.allocation.create({
          data: {
            studentId: student.id,
            roomId: room.id,
            requestId: request.id,
            allocatedById: admin.id,
            status: 'ACTIVE',
            checkInDate: new Date('2025-07-20'),
            academicYear,
            semester,
            notes: 'Seeded allocation',
          },
        });
      }

      const status: RoomStatus =
        occupants >= room.totalBeds
          ? RoomStatus.FULL
          : occupants > 0
            ? RoomStatus.PARTIALLY_OCCUPIED
            : RoomStatus.AVAILABLE;

      await prisma.room.update({
        where: { id: room.id },
        data: { occupiedBeds: occupants, status },
      });

      if (occupants > 0) roomsUsed++;
    }

    const hostelRooms = await prisma.room.findMany({
      where: { hostelId: hostel.id },
      select: { status: true },
    });

    await prisma.hostel.update({
      where: { id: hostel.id },
      data: {
        totalRooms: hostelRooms.length,
        availableRooms: hostelRooms.filter(
          (room) => room.status !== RoomStatus.FULL && room.status !== RoomStatus.UNDER_MAINTENANCE
        ).length,
      },
    });

    summary.byGender[gender] = {
      total: group.length,
      allocated: selected.length,
      unassigned: unassigned.length,
    };
    summary.allocated += selected.length;
    summary.unassigned += unassigned.length;
    summary.roomsUsed += roomsUsed;
  }

  return summary;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Seeding room allocations (100%, 3 beds per room)...');
    const summary = await seedAllocations(prisma);

    console.log('\n🎉 Allocation seeding complete!');
    console.log(`  Students:   ${summary.totalStudents}`);
    console.log(`  Allocated:  ${summary.allocated} (${((summary.allocated / summary.totalStudents) * 100).toFixed(1)}%)`);
    console.log(`  Unassigned: ${summary.unassigned} (${((summary.unassigned / summary.totalStudents) * 100).toFixed(1)}%)`);
    console.log(`  Rooms used: ${summary.roomsUsed}`);
    for (const [gender, stats] of Object.entries(summary.byGender)) {
      console.log(`  ${gender.padEnd(7)} → ${stats.allocated}/${stats.total} allocated, ${stats.unassigned} unassigned`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Allocation seeding failed:', error);
    process.exit(1);
  });
}
