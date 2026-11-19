import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// MongoDB connector in Prisma 6 connects directly from the URL in schema.prisma
// (DATABASE_URL). No SQL driver adapter is needed.
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'pretty',
  });
}

const prisma: PrismaClient = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
