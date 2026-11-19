import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

declare global {
  var __prisma: PrismaClient | undefined;
}

function getDbConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL environment variable is required');
  const mysqlPrefix = /^mysql:\/\//;
  const u = new URL(raw.replace(mysqlPrefix, 'http://'));
  const slashPrefix = /^\//;
  return {
    host: u.hostname,
    port: parseInt(u.port || '3306', 10),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(slashPrefix, '').split('?')[0],
    connectionLimit: 10,
  };
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb(getDbConfig());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'pretty',
  });
}

const prisma: PrismaClient = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
