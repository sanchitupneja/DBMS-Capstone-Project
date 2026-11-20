import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import {
  sendSuccess,
  sendError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  asyncHandler,
} from '../utils/errors';

export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const {
    email, password, fullName, studentId, phone, gender, course, yearOfStudy,
  } = req.body;

  const [existingEmail, existingStudentId] = await Promise.all([
    prisma.student.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { studentId } }),
  ]);

  if (existingEmail) throw new ConflictError('Email is already registered');
  if (existingStudentId) throw new ConflictError('Student ID is already registered');

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10));

  const student = await prisma.student.create({
    data: {
      email,
      passwordHash,
      fullName,
      studentId,
      phone,
      gender,
      course,
      yearOfStudy,
      role: Role.STUDENT,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      studentId: true,
      gender: true,
      course: true,
      yearOfStudy: true,
      role: true,
      createdAt: true,
    },
  });

  const tokens = generateTokenPair({ id: student.id, email: student.email, role: student.role });

  await prisma.student.update({
    where: { id: student.id },
    data: { refreshToken: tokens.refreshToken },
  });

  sendSuccess(res, { student, ...tokens }, 'Student registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  let user: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: Role;
    refreshToken?: string | null;
  } | null = null;

  if (role === 'ADMIN') {
    user = await prisma.admin.findUnique({ where: { email } });
  } else if (role === 'STUDENT') {
    user = await prisma.student.findUnique({ where: { email } });
  } else {
    user = (await prisma.admin.findUnique({ where: { email } })) ?? (await prisma.student.findUnique({ where: { email } }));
  }

  // Graceful fallback: if user selected the other role tab by mistake, still check the matching account
  if (!user) {
    if (role === 'ADMIN') {
      user = await prisma.student.findUnique({ where: { email } });
    } else {
      user = await prisma.admin.findUnique({ where: { email } });
    }
  }

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });

  if (user.role === Role.ADMIN) {
    await prisma.admin.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });
  } else {
    await prisma.student.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });
  }

  const { passwordHash: _, refreshToken: __, ...safeUser } = user;

  sendSuccess(res, { user: safeUser, ...tokens }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type');
  }

  let storedToken: string | null = null;

  if (decoded.role === Role.ADMIN) {
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) throw new NotFoundError('Account');
    storedToken = admin.refreshToken;
  } else {
    const student = await prisma.student.findUnique({ where: { id: decoded.id } });
    if (!student) throw new NotFoundError('Account');
    storedToken = student.refreshToken;
  }

  if (storedToken !== token) {
    
    if (decoded.role === Role.ADMIN) {
      await prisma.admin.update({ where: { id: decoded.id }, data: { refreshToken: null } });
    } else {
      await prisma.student.update({ where: { id: decoded.id }, data: { refreshToken: null } });
    }
    throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
  }

  const newTokens = generateTokenPair({ id: decoded.id, email: decoded.email, role: decoded.role });

  if (decoded.role === Role.ADMIN) {
    await prisma.admin.update({ where: { id: decoded.id }, data: { refreshToken: newTokens.refreshToken } });
  } else {
    await prisma.student.update({ where: { id: decoded.id }, data: { refreshToken: newTokens.refreshToken } });
  }

  sendSuccess(res, newTokens, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) throw new UnauthorizedError('Not authenticated');

  if (user.role === Role.ADMIN) {
    await prisma.admin.update({ where: { id: user.id }, data: { refreshToken: null } });
  } else {
    await prisma.student.update({ where: { id: user.id }, data: { refreshToken: null } });
  }

  sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) throw new UnauthorizedError('Not authenticated');

  if (user.role === Role.ADMIN) {
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    if (!admin) throw new NotFoundError('Account');
    sendSuccess(res, admin, 'Profile fetched');
  } else {
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, fullName: true, studentId: true,
        phone: true, gender: true, course: true, yearOfStudy: true,
        role: true, profileImageUrl: true, isEmailVerified: true, createdAt: true,
      },
    });
    if (!student) throw new NotFoundError('Account');
    sendSuccess(res, student, 'Profile fetched');
  }
});

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit as string ?? '10', 10));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string | undefined) ?? '';
  const genderFilter = req.query.gender as string | undefined;

  const where = {
    ...(search && {
      OR: [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { studentId: { contains: search } },
        { course: { contains: search } },
      ],
    }),
    ...(genderFilter && { gender: genderFilter as 'MALE' | 'FEMALE' | 'OTHER' }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        phone: true,
        gender: true,
        course: true,
        yearOfStudy: true,
        role: true,
        createdAt: true,
        allocations: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            status: true,
            room: { select: { roomNumber: true, hostel: { select: { name: true } } } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where }),
  ]);

  // Flatten the LEFT JOIN with allocations/rooms so the table can render a
  // single room_number field (null when the student has no active allocation).
  const studentsWithRoom = students.map(({ allocations, ...student }) => {
    const activeAllocation = allocations[0];
    return {
      ...student,
      allocations,
      room_number: activeAllocation?.room.roomNumber ?? null,
      room_hostel_name: activeAllocation?.room.hostel.name ?? null,
      active_allocation_id: activeAllocation?.id ?? null,
    };
  });

  sendSuccess(res, studentsWithRoom, 'Students fetched', 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
