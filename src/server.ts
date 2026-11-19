import 'dotenv/config';
import { createApp } from './app';
import prisma from './config/database';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

async function startServer(): Promise<void> {
  try {
    
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║     🏠 Hostel Room Allocation System          ║
║     Server running on port ${PORT}               ║
║     Environment: ${process.env.NODE_ENV?.padEnd(27)}║
║     API Base URL: http://localhost:${PORT}/api   ║
╚═══════════════════════════════════════════════╝
      `);
    });

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
