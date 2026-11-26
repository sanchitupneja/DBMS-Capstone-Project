import 'dotenv/config';
import { createApp } from './app';
import prisma from './config/database';

const PORT = parseInt(
  process.env.PORT ?? (process.env.NODE_ENV === 'production' ? '10000' : '5000'),
  10
);

async function connectWithRetry(maxRetries = 10, delayMs = 1500): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.log(`⏳ Waiting for database connection (attempt ${attempt}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function startServer(): Promise<void> {
  try {
    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║     🏠 Hostel Room Allocation System          ║
║     Server running on port ${PORT}               ║
║     Environment: ${(process.env.NODE_ENV ?? 'development').padEnd(27)}║
║     API Base URL: http://localhost:${PORT}/api   ║
╚═══════════════════════════════════════════════╝
      `);
    });

    // Connect to database with retry; runs non-blocking so health checks succeed immediately
    connectWithRetry(15, 2000).catch((err) => {
      console.error('⚠️ Database connection warning:', err instanceof Error ? err.message : err);
    });

    // Keep event loop active
    setInterval(() => {}, 1000 * 60 * 60);

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('💥 Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
