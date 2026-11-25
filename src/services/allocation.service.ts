import { Allocation, RequestStatus, RoomStatus, AllocationStatus } from '@prisma/client';
import prisma from '../config/database';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

export async function runAllocationEngine(
  requestId: string,
  roomId: string,
  adminId: string | null,
  notes?: string
): Promise<Allocation> {
  
  const request = await prisma.allocationRequest.findUnique({
    where: { id: requestId },
    include: { student: true },
  });

  if (!request) throw new NotFoundError('Allocation request');
  if (request.status === RequestStatus.APPROVED) {
    throw new ConflictError('Request is already approved and allocated');
  }
  if (
    request.status !== RequestStatus.PENDING &&
    request.status !== RequestStatus.WAITLISTED
  ) {
    throw new BadRequestError(`Cannot allocate a ${request.status} request`);
  }

  const allocation = await prisma.$transaction(
    async (tx) => {
      // Pessimistic locking (FOR UPDATE) ensures concurrent allocation
      // requests cannot double-allocate the last available bed.
      const lockedRooms = await tx.$queryRaw<Array<{
        id: string;
        occupied_beds: number;
        total_beds: number;
        status: string;
        hostel_id: string;
      }>>`
        SELECT id, \`occupiedBeds\` AS occupied_beds, \`totalBeds\` AS total_beds,
               status, \`hostelId\` AS hostel_id
        FROM rooms
        WHERE id = ${roomId}
        FOR UPDATE
      `;

      if (lockedRooms.length === 0) throw new NotFoundError('Room');
      const room = lockedRooms[0];

      if (room.occupied_beds >= room.total_beds) {
        throw new ConflictError(
          `Room is fully occupied (${room.occupied_beds}/${room.total_beds} beds filled). Please choose another room.`
        );
      }

      if (room.status === RoomStatus.FULL || room.status === RoomStatus.UNDER_MAINTENANCE) {
        throw new ConflictError(`Room is not available (status: ${room.status})`);
      }

      const existingAllocation = await tx.allocation.findFirst({
        where: { studentId: request.studentId, status: AllocationStatus.ACTIVE },
      });
      if (existingAllocation) {
        throw new ConflictError('Student already has an active room allocation');
      }

      const newOccupiedBeds = room.occupied_beds + 1;
      const newRoomStatus: RoomStatus =
        newOccupiedBeds >= room.total_beds ? RoomStatus.FULL : RoomStatus.PARTIALLY_OCCUPIED;

      const newAllocation = await tx.allocation.create({
        data: {
          studentId: request.studentId,
          roomId,
          requestId,
          allocatedById: adminId,
          status: AllocationStatus.ACTIVE,
          checkInDate: new Date(),
          academicYear: request.academicYear,
          semester: request.semester,
          notes: notes ?? null,
        },
      });

      await tx.room.update({
        where: { id: roomId },
        data: {
          occupiedBeds: { increment: 1 },
          status: newRoomStatus,
        },
      });

      await tx.allocationRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          processedById: adminId,
          processedAt: new Date(),
        },
      });

      if (newRoomStatus === RoomStatus.FULL) {
        await tx.hostel.update({
          where: { id: room.hostel_id },
          data: { availableRooms: { decrement: 1 } },
        });
      }

      return newAllocation;
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );

  return allocation;
}

export async function findBestRoom(
  hostelId: string,
  preferredRoomType: 'AC' | 'NON_AC',
  preferredFloor: number | null,
  studentGender: 'MALE' | 'FEMALE' | 'OTHER'
): Promise<{ roomId: string; hostelId: string; roomNumber: string } | null> {
  
  if (preferredFloor !== null) {
    const exactMatch = await prisma.room.findFirst({
      where: {
        hostelId,
        roomType: preferredRoomType,
        floor: preferredFloor,
        status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
      },
      orderBy: { occupiedBeds: 'asc' },
    });
    if (exactMatch) {
      return { roomId: exactMatch.id, hostelId: exactMatch.hostelId, roomNumber: exactMatch.roomNumber };
    }
  }

  const hostelMatch = await prisma.room.findFirst({
    where: {
      hostelId,
      roomType: preferredRoomType,
      status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
    },
    orderBy: [{ floor: 'asc' }, { occupiedBeds: 'asc' }],
  });
  if (hostelMatch) {
    return { roomId: hostelMatch.id, hostelId: hostelMatch.hostelId, roomNumber: hostelMatch.roomNumber };
  }

  const sameHostelAnyType = await prisma.room.findFirst({
    where: {
      hostelId,
      status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
    },
    orderBy: { occupiedBeds: 'asc' },
  });
  if (sameHostelAnyType) {
    return {
      roomId: sameHostelAnyType.id,
      hostelId: sameHostelAnyType.hostelId,
      roomNumber: sameHostelAnyType.roomNumber,
    };
  }

  const anyHostelMatch = await prisma.room.findFirst({
    where: {
      hostel: {
        isActive: true,
        gender: { in: [studentGender, 'OTHER'] },
      },
      roomType: preferredRoomType,
      status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
    },
    orderBy: { occupiedBeds: 'asc' },
  });
  if (anyHostelMatch) {
    return {
      roomId: anyHostelMatch.id,
      hostelId: anyHostelMatch.hostelId,
      roomNumber: anyHostelMatch.roomNumber,
    };
  }

  return null;
}
