import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed authorization header');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')
    ) {
      throw new UnauthorizedError('Token is invalid or has expired. Please log in again.');
    }
    throw err;
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
    }
    next();
  };
}

export function guardStudentSelf(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { user } = req;
  const paramId = req.params.studentId ?? req.params.id;

  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  if (user.role === Role.ADMIN) {
    next();
    return;
  }

  if (user.id !== paramId) {
    throw new ForbiddenError('You can only access your own resources');
  }

  next();
}

export async function verifyAccountExists(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const { user } = req;
  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  if (user.role === Role.ADMIN) {
    const admin = await prisma.admin.findUnique({ where: { id: user.id } });
    if (!admin) {
      throw new UnauthorizedError('Account no longer exists');
    }
  } else {
    const student = await prisma.student.findUnique({ where: { id: user.id } });
    if (!student) {
      throw new UnauthorizedError('Account no longer exists');
    }
  }

  next();
}
