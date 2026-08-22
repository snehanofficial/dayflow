import { prisma } from '../src/modules/core/database/index.js';
import { hashPassword } from '../src/modules/core/auth/hash.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '⚠️ SEED_USER_EMAIL or SEED_USER_PASSWORD env variables not set. Skipping default user seeding.',
    );
    return;
  }

  console.log(`Seeding user: ${email}...`);

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      employeeId: 'EMP-001',
      role: 'HR',
      emailVerified: true,
    },
    create: {
      email,
      passwordHash: hashedPassword,
      employeeId: 'EMP-001',
      role: 'HR',
      emailVerified: true,
    },
  });

  // Seed permissions
  const permissions = [
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'resources', action: 'read' },
    { resource: 'resources', action: 'create' },
    { resource: 'resources', action: 'delete' },
    { resource: 'leave', action: 'read' },
    { resource: 'leave', action: 'manage' },
  ];

  for (const perm of permissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_resource_action: {
          userId: user.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        userId: user.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  console.log(`✅ Seeding completed. Created user ${email} with permissions.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
