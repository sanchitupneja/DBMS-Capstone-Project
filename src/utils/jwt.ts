import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export function generateAccessToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'type'>
): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as string;
  return jwt.sign(
    { ...payload, type: 'access' },
    secret,
    { expiresIn } as SignOptions
  );
}

export function generateRefreshToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'type'>
): string {
  const secret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as string;
  return jwt.sign(
    { ...payload, type: 'refresh' },
    secret,
    { expiresIn } as SignOptions
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET!;
  return jwt.verify(token, secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET!;
  return jwt.verify(token, secret) as TokenPayload;
}

export function generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp' | 'type'>): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
