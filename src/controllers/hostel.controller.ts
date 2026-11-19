import { Request, Response } from 'express';
import { RoomStatus } from '@prisma/client';
import prisma from '../config/database';
import {
  sendSuccess,
  NotFoundError,
  ConflictError,
  asyncHandler,
} from '../utils/errors';

function param(req: Request, key: string): string {
  const v = (req.params as Record<string, string | string[]>)[key];
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export const listHostels = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string ?? '10', 10)));
  const skip = (page - 1) * limit;
  const gender = req.query.gender as string | undefined;

  const where = {
    isActive: true,
    ...(gender && { gender: gender as 'MALE' | 'FEMALE' | 'OTHER' }),
  };

  const [hostels, total] = await Promise.all([
    prisma.hostel.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.hostel.count({ where }),
  ]);

  sendSuccess(res, hostels, 'Hostels fetched', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getHostel = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, 'id');
  const hostel = await prisma.hostel.findUnique({
    where: { id },
    include: {
      rooms: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          roomType: true,
          totalBeds: true,
          occupiedBeds: true,
          status: true,
          pricePerMonth: true,
          amenities: true,
        },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      },
      _count: { select: { rooms: true, allocationRequests: true } },
    },
  });

  if (!hostel) throw new NotFoundError('Hostel');
  sendSuccess(res, hostel, 'Hostel fetched');
});

export const createHostel = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, gender, address, amenities, imageUrl } = req.body as {
    name: string; description?: string; gender: 'MALE' | 'FEMALE' | 'OTHER';
    address: string; amenities?: string[]; imageUrl?: string;
  };

  const existing = await prisma.hostel.findUnique({ where: { name } });
  if (existing) throw new ConflictError(`A hostel named "${name}" already exists`);

  const hostel = await prisma.hostel.create({
    data: { name, description, gender, address, amenities: amenities ?? [], imageUrl },
  });

  sendSuccess(res, hostel, 'Hostel created successfully', 201);
});

export const updateHostel = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, 'id');
  const hostel = await prisma.hostel.findUnique({ where: { id } });
  if (!hostel) throw new NotFoundError('Hostel');

  const updated = await prisma.hostel.update({
    where: { id },
    data: req.body as Record<string, unknown>,
  });

  sendSuccess(res, updated, 'Hostel updated');
});

export const deactivateHostel = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, 'id');
  const hostel = await prisma.hostel.findUnique({ where: { id } });
  if (!hostel) throw new NotFoundError('Hostel');

  await prisma.hostel.update({ where: { id }, data: { isActive: false } });
  sendSuccess(res, null, 'Hostel deactivated');
});

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const hostelId = param(req, 'hostelId');

  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
  if (!hostel) throw new NotFoundError('Hostel');

  const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? '10', 10));
  const skip = (page - 1) * limit;

  const roomType = req.query.roomType as 'AC' | 'NON_AC' | undefined;
  const status = req.query.status as RoomStatus | undefined;
  const floorRaw = req.query.floor;
  const floor = floorRaw !== undefined ? parseInt(floorRaw as string, 10) : undefined;

  const where = {
    hostelId,
    ...(roomType && { roomType }),
    ...(status && { status }),
    ...(floor !== undefined && !isNaN(floor) && { floor }),
  };

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    }),
    prisma.room.count({ where }),
  ]);

  sendSuccess(res, rooms, 'Rooms fetched', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const hostelId = param(req, 'hostelId');
  const roomId = param(req, 'roomId');

  const room = await prisma.room.findFirst({
    where: { id: roomId, hostelId },
    include: {
      hostel: { select: { name: true, gender: true } },
      allocations: {
        where: { status: 'ACTIVE' },
        include: {
          student: { select: { fullName: true, studentId: true, gender: true } },
        },
      },
    },
  });

  if (!room) throw new NotFoundError('Room');
  sendSuccess(res, room, 'Room fetched');
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const hostelId = param(req, 'hostelId');
  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
  if (!hostel) throw new NotFoundError('Hostel');

  const { roomNumber, floor, roomType, totalBeds, pricePerMonth, amenities } = req.body as {
    roomNumber: string; floor: number; roomType: 'AC' | 'NON_AC';
    totalBeds: number; pricePerMonth: number; amenities?: string[];
  };

  const existing = await prisma.room.findUnique({
    where: { hostelId_roomNumber: { hostelId, roomNumber } },
  });
  if (existing) throw new ConflictError(`Room ${roomNumber} already exists in this hostel`);

  const room = await prisma.room.create({
    data: {
      hostelId,
      roomNumber,
      floor,
      roomType,
      totalBeds,
      occupiedBeds: 0,
      status: RoomStatus.AVAILABLE,
      pricePerMonth,
      amenities: amenities ?? [],
    },
  });

  await prisma.hostel.update({
    where: { id: hostelId },
    data: {
      totalRooms: { increment: 1 },
      availableRooms: { increment: 1 },
    },
  });

  sendSuccess(res, room, 'Room created', 201);
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const hostelId = param(req, 'hostelId');
  const roomId = param(req, 'roomId');

  const room = await prisma.room.findFirst({ where: { id: roomId, hostelId } });
  if (!room) throw new NotFoundError('Room');

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: req.body as Record<string, unknown>,
  });

  sendSuccess(res, updated, 'Room updated');
});

export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  const hostelId = param(req, 'hostelId');
  const roomId = param(req, 'roomId');

  const room = await prisma.room.findFirst({ where: { id: roomId, hostelId } });
  if (!room) throw new NotFoundError('Room');

  const activeAllocations = await prisma.allocation.count({
    where: { roomId, status: 'ACTIVE' },
  });
  if (activeAllocations > 0) {
    throw new ConflictError('Cannot delete a room with active allocations');
  }

  await prisma.room.delete({ where: { id: roomId } });

  await prisma.hostel.update({
    where: { id: hostelId },
    data: {
      totalRooms: { decrement: 1 },
      availableRooms: { decrement: room.status === 'AVAILABLE' ? 1 : 0 },
    },
  });

  sendSuccess(res, null, 'Room deleted');
});
