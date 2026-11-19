import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL must be set in .env');

function parseUrl(raw: string) {
  const mysqlPrefix = /^mysql:\/\//;
  const u = new URL(raw.replace(mysqlPrefix, 'http://'));
  const slashPrefix = /^\//;
  return {
    host: u.hostname,
    port: parseInt(u.port || '3306', 10),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(slashPrefix, '').split('?')[0],
    connectionLimit: 5,
  };
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: { url: connectionString },
  migrate: {
    async adapter() {
      const { PrismaMariaDb } = await import('@prisma/adapter-mariadb');
      return new PrismaMariaDb(parseUrl(process.env.DATABASE_URL!));
    },
  },
});
