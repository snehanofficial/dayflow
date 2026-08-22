import { prisma } from '../src/modules/core/database/index.js';

async function run() {
  try {
    console.log('Querying users...');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    await prisma.$disconnect();
  } catch (e) {
    console.error('Prisma query failed:', e);
  }
}

run();
