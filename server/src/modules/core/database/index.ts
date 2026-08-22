import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

let prisma: PrismaClient;

if (config.NODE_ENV === 'production') {
  const adapter = new PrismaPg(config.DATABASE_URL);
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple Prisma instances in development due to hot reloading
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };

  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaPg(config.DATABASE_URL);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

// Graceful shutdown state tracking
let isDisconnecting = false;
const disconnect = async () => {
  if (isDisconnecting) return;
  isDisconnecting = true;
  try {
    await prisma.$disconnect();
    logger.info('Database client disconnected successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting database client.');
  }
};

process.on('beforeExit', disconnect);
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

export { prisma };
export type { PrismaClient };
