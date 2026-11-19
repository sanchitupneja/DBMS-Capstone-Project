import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      sendError(res, 'Validation failed', 422, JSON.stringify(issues));
      return;
    }
    
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  studentId: z.string().min(3, 'Student ID must be at least 3 characters').max(50),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  course: z.string().min(2, 'Course must be at least 2 characters').max(100),
  yearOfStudy: z.number().int().min(1).max(6),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'ADMIN']).optional().default('STUDENT'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createHostelSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(5).max(200),
  amenities: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
});

export const updateHostelSchema = createHostelSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  floor: z.number().int().min(0).max(50),
  roomType: z.enum(['AC', 'NON_AC']),
  totalBeds: z.number().int().min(1).max(10),
  pricePerMonth: z.number().positive('Price must be positive'),
  amenities: z.array(z.string()).default([]),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'UNDER_MAINTENANCE']).optional(),
});

export const createRequestSchema = z.object({
  hostelId: z.string().uuid('Invalid hostel ID'),
  preferredRoomType: z.enum(['AC', 'NON_AC']),
  preferredFloor: z.number().int().min(0).max(50).optional(),
  specialRequirements: z.string().max(500).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  semester: z.number().int().min(1).max(2),
});

export const processRequestSchema = z.object({
  action: z.enum(['approve', 'reject', 'waitlist']),
  rejectionReason: z.string().max(500).optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
  notes: z.string().max(500).optional(),
});

export const roomFilterSchema = z.object({
  hostelId: z.string().uuid().optional(),
  roomType: z.enum(['AC', 'NON_AC']).optional(),
  status: z.enum(['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'UNDER_MAINTENANCE']).optional(),
  floor: z.string().regex(/^\d+$/).transform(Number).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
});

export const requestFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED']).optional(),
  hostelId: z.string().uuid().optional(),
  academicYear: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
});
