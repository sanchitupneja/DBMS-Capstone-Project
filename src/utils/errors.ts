import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): Response {
  const response: ApiResponse = { success: false, message, error };
  return res.status(statusCode).json(response);
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (
    err.constructor.name === 'PrismaClientInitializationError' ||
    (err as unknown as { errorCode?: string }).errorCode === 'P1000' ||
    err.message?.includes('Authentication failed against database server') ||
    err.message?.includes("Can't reach database server")
  ) {
    sendError(
      res,
      'Database connection failed: Invalid MySQL password or server unreachable. Please update DATABASE_URL in your .env file with your MySQL password.',
      500,
      err.message
    );
    return;
  }

  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      sendError(
        res,
        `A record with this ${prismaError.meta?.target?.join(', ')} already exists`,
        409
      );
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500, err.message);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
