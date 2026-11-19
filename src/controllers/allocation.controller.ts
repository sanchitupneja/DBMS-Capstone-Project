import { Request, Response } from 'express';
import { Role, RequestStatus } from '@prisma/client';
import prisma from '../config/database';
import {
  sendSuccess,
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
  asyncHandler,
} from '../utils/errors';
import { runAllocationEngine } from '../services/allocation.service';

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const { hostelId, preferredRoomType, preferredFloor, specialRequirements, academicYear, semester } =
    req.body;

  const hostel = await prisma.hostel.findFirst({ where: { id: hostelId, isActive: true } });
  if (!hostel) throw new NotFoundError('Hostel');

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError('Student');

  if (hostel.gender !== 'OTHER' && hostel.gender !== student.gender) {
    throw new BadRequestError(
      `This hostel is for ${hostel.gender.toLowerCase()} students only`
    );
  }

  const existingRequest = await prisma.allocationRequest.findUnique({
    where: { studentId_academicYear_semester: { studentId, academicYear, semester } },
  });

  if (existingRequest) {
    if (existingRequest.status === RequestStatus.CANCELLED) {
      
      await prisma.allocationRequest.delete({ where: { id: existingRequest.id } });
    } else {
      throw new ConflictError(
        `You already have a ${existingRequest.status.toLowerCase()} request for ${academicYear} semester ${semester}`
      );
    }
  }

  const activeAllocation = await prisma.allocation.findFirst({
    where: { studentId, status: 'ACTIVE' },
  });
  if (activeAllocation) {
    throw new ConflictError('You already have an active room allocation');
  }

  const request = await prisma.allocationRequest.create({
    data: {
      studentId,
      hostelId,
      preferredRoomType,
      preferredFloor,
      specialRequirements,
      academicYear,
      semester,
      status: RequestStatus.PENDING,
    },
    include: {
      hostel: { select: { name: true } },
    },
  });

  sendSuccess(res, request, 'Allocation request submitted successfully', 201);
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? '10', 10));
  const skip = (page - 1) * limit;

  const statusFilter = req.query.status as RequestStatus | undefined;
  const hostelIdFilter = req.query.hostelId as string | undefined;
  const academicYearFilter = req.query.academicYear as string | undefined;

  const where = {
    ...(user!.role !== Role.ADMIN && { studentId: user!.id }),
    ...(statusFilter && { status: statusFilter }),
    ...(hostelIdFilter && { hostelId: hostelIdFilter }),
    ...(academicYearFilter && { academicYear: academicYearFilter }),
  };

  const [requests, total] = await Promise.all([
    prisma.allocationRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { fullName: true, studentId: true, email: true, gender: true } },
        hostel: { select: { name: true, gender: true } },
        allocation: {
          select: {
            id: true,
            status: true,
            checkInDate: true,
            room: { select: { roomNumber: true, floor: true, roomType: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.allocationRequest.count({ where }),
  ]);

  sendSuccess(res, requests, 'Requests fetched', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const request = await prisma.allocationRequest.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      student: { select: { fullName: true, studentId: true, email: true, gender: true } },
      hostel: { select: { name: true, gender: true, address: true } },
      processedBy: { select: { fullName: true, email: true } },
      allocation: {
        include: {
          room: true,
        },
      },
    },
  });

  if (!request) throw new NotFoundError('Request');

  if (user!.role !== Role.ADMIN && request.studentId !== user!.id) {
    throw new ForbiddenError('Access denied');
  }

  sendSuccess(res, request, 'Request fetched');
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const request = await prisma.allocationRequest.findUnique({ where: { id: req.params['id'] as string } });

  if (!request) throw new NotFoundError('Request');
  if (request.studentId !== studentId) throw new ForbiddenError('Access denied');
  if (request.status !== RequestStatus.PENDING && request.status !== RequestStatus.WAITLISTED) {
    throw new BadRequestError(`Cannot cancel a ${request.status.toLowerCase()} request`);
  }

  const updated = await prisma.allocationRequest.update({
    where: { id: req.params['id'] as string },
    data: { status: RequestStatus.CANCELLED },
  });

  sendSuccess(res, updated, 'Request cancelled successfully');
});

export const processRequest = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { action, rejectionReason, roomId, notes } = req.body;

  const request = await prisma.allocationRequest.findUnique({
    where: { id: req.params['id'] as string },
    include: { student: true },
  });

  if (!request) throw new NotFoundError('Request');
  if (request.status !== RequestStatus.PENDING && request.status !== RequestStatus.WAITLISTED) {
    throw new BadRequestError(`Request is already ${request.status.toLowerCase()}`);
  }

  if (action === 'reject') {
    const updated = await prisma.allocationRequest.update({
      where: { id: req.params['id'] as string },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason,
        processedById: adminId,
        processedAt: new Date(),
      },
    });
    sendSuccess(res, updated, 'Request rejected');
    return;
  }

  if (action === 'waitlist') {
    const updated = await prisma.allocationRequest.update({
      where: { id: req.params['id'] as string },
      data: {
        status: RequestStatus.WAITLISTED,
        processedById: adminId,
        processedAt: new Date(),
      },
    });
    sendSuccess(res, updated, 'Request added to waitlist');
    return;
  }

  if (action === 'approve') {
    if (!roomId) throw new BadRequestError('Room ID is required to approve a request');
    const result = await runAllocationEngine(request.id, roomId, adminId, notes);
    sendSuccess(res, result, 'Request approved and room allocated');
    return;
  }

  throw new BadRequestError(`Invalid action: ${action}`);
});

export const triggerAutoAllocation = asyncHandler(async (req: Request, res: Response) => {
  const { academicYear, semester } = req.body;

  if (!academicYear || !semester) {
    throw new BadRequestError('academicYear and semester are required');
  }

  const pendingRequests = await prisma.allocationRequest.findMany({
    where: {
      status: RequestStatus.PENDING,
      academicYear,
      semester: parseInt(semester, 10),
    },
    include: { student: true },
    orderBy: { createdAt: 'asc' }, 
  });

  const results = {
    allocated: 0,
    waitlisted: 0,
    failed: 0,
    details: [] as Array<{ requestId: string; studentName: string; status: string; message: string }>,
  };

  for (const request of pendingRequests) {
    try {
      
      const room = await prisma.room.findFirst({
        where: {
          hostelId: request.hostelId,
          roomType: request.preferredRoomType,
          status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
          ...(request.preferredFloor !== null && { floor: request.preferredFloor }),
        },
        orderBy: [{ occupiedBeds: 'asc' }, { floor: 'asc' }],
      });

      if (!room) {
        
        await prisma.allocationRequest.update({
          where: { id: request.id },
          data: { status: RequestStatus.WAITLISTED, processedAt: new Date() },
        });
        results.waitlisted++;
        results.details.push({
          requestId: request.id,
          studentName: request.student.fullName,
          status: 'WAITLISTED',
          message: 'No available room matching preferences',
        });
        continue;
      }

      await runAllocationEngine(request.id, room.id, null, 'Auto-allocated');
      results.allocated++;
      results.details.push({
        requestId: request.id,
        studentName: request.student.fullName,
        status: 'ALLOCATED',
        message: `Assigned to room ${room.roomNumber}`,
      });
    } catch (err: unknown) {
      results.failed++;
      results.details.push({
        requestId: request.id,
        studentName: request.student.fullName,
        status: 'FAILED',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  sendSuccess(res, results, `Auto-allocation completed: ${results.allocated} allocated, ${results.waitlisted} waitlisted`);
});

export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? '10', 10));
  const skip = (page - 1) * limit;

  const where = {
    ...(user!.role !== Role.ADMIN && { studentId: user!.id }),
  };

  const [allocations, total] = await Promise.all([
    prisma.allocation.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { fullName: true, studentId: true, email: true } },
        room: {
          include: { hostel: { select: { name: true, address: true, amenities: true } } },
        },
        allocatedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.allocation.count({ where }),
  ]);

  sendSuccess(res, allocations, 'Allocations fetched', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export const vacateAllocation = asyncHandler(async (req: Request, res: Response) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: req.params['id'] as string },
    include: { room: true },
  });

  if (!allocation) throw new NotFoundError('Allocation');
  if (allocation.status !== 'ACTIVE') {
    throw new BadRequestError(`Allocation is already ${allocation.status.toLowerCase()}`);
  }

  const updatedAllocation = await prisma.$transaction(async (tx) => {
    const updated = await tx.allocation.update({
      where: { id: req.params['id'] as string },
      data: { status: 'VACATED', checkOutDate: new Date() },
    });

    const roomBedsAfter = (allocation.room as { occupiedBeds: number }).occupiedBeds - 1;

    await tx.room.update({
      where: { id: allocation.roomId },
      data: {
        occupiedBeds: { decrement: 1 },
        status: roomBedsAfter <= 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED',
      },
    });

    if (roomBedsAfter <= 0) {
      await tx.hostel.update({
        where: { id: (allocation.room as { hostelId: string }).hostelId },
        data: { availableRooms: { increment: 1 } },
      });
    }

    return updated;
  });

  sendSuccess(res, updatedAllocation, 'Room vacated successfully');
});

export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalStudents,
    totalHostels,
    totalRooms,
    pendingRequests,
    activeAllocations,
    roomsByType,
    requestsByStatus,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.hostel.count({ where: { isActive: true } }),
    prisma.room.count(),
    prisma.allocationRequest.count({ where: { status: 'PENDING' } }),
    prisma.allocation.count({ where: { status: 'ACTIVE' } }),
    prisma.room.groupBy({
      by: ['roomType', 'status'],
      _count: true,
    }),
    prisma.allocationRequest.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const availableRooms = await prisma.room.count({
    where: { status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] } },
  });

  sendSuccess(
    res,
    {
      overview: {
        totalStudents,
        totalHostels,
        totalRooms,
        availableRooms,
        occupiedRooms: totalRooms - availableRooms,
        pendingRequests,
        activeAllocations,
        occupancyRate: totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100).toFixed(1) : '0',
      },
      roomsByType,
      requestsByStatus,
    },
    'Dashboard metrics fetched'
  );
});
