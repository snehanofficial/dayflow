import { prisma } from '../src/modules/core/database/index.js';
import { hashPassword } from '../src/modules/core/auth/hash.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const defaultPassword = process.env.SEED_USER_PASSWORD || 'password123';
  const hashedPassword = await hashPassword(defaultPassword);

  // 1. Seed HR Demo User
  console.log('Seeding HR demo user: hr@dayflow.com...');
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@dayflow.com' },
    update: {
      passwordHash: hashedPassword,
      employeeId: 'EMP-001',
      role: 'HR',
      emailVerified: true,
    },
    create: {
      email: 'hr@dayflow.com',
      passwordHash: hashedPassword,
      employeeId: 'EMP-001',
      role: 'HR',
      emailVerified: true,
    },
  });

  // Seed Employee Profile for HR
  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: {
      employeeCode: 'EMP-001',
      firstName: 'HR',
      lastName: 'Manager',
      phone: '+15550100',
      department: 'People Operations',
      designation: 'HR Manager',
      joiningDate: new Date('2025-01-01'),
      employmentStatus: 'ACTIVE',
    },
    create: {
      userId: hrUser.id,
      employeeCode: 'EMP-001',
      firstName: 'HR',
      lastName: 'Manager',
      phone: '+15550100',
      department: 'People Operations',
      designation: 'HR Manager',
      joiningDate: new Date('2025-01-01'),
      employmentStatus: 'ACTIVE',
    },
  });

  // Seed permissions for HR
  const hrPermissions = [
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'resources', action: 'read' },
    { resource: 'resources', action: 'create' },
    { resource: 'resources', action: 'delete' },
    { resource: 'leave', action: 'read' },
    { resource: 'leave', action: 'manage' },
    { resource: 'payroll', action: 'read' },
    { resource: 'payroll', action: 'manage' },
    { resource: 'analytics', action: 'read' },
  ];

  for (const perm of hrPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_resource_action: {
          userId: hrUser.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        userId: hrUser.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  // Seed Salary Structure for HR
  await prisma.salaryStructure.upsert({
    where: { employeeId: 'EMP-001' },
    update: {
      basicSalary: 6500,
      allowances: 1500,
      deductions: 500,
      department: 'People Operations',
      designation: 'HR Manager',
    },
    create: {
      employeeId: 'EMP-001',
      basicSalary: 6500,
      allowances: 1500,
      deductions: 500,
      department: 'People Operations',
      designation: 'HR Manager',
    },
  });

  // 2. Seed Employee Demo User
  console.log('Seeding Employee demo user: employee@dayflow.com...');
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@dayflow.com' },
    update: {
      passwordHash: hashedPassword,
      employeeId: 'EMP-DEMO-002',
      role: 'EMPLOYEE',
      emailVerified: true,
    },
    create: {
      email: 'employee@dayflow.com',
      passwordHash: hashedPassword,
      employeeId: 'EMP-DEMO-002',
      role: 'EMPLOYEE',
      emailVerified: true,
    },
  });

  // Seed Employee Profile for Employee
  await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {
      employeeCode: 'EMP-DEMO-002',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15550199',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: new Date('2025-06-01'),
      employmentStatus: 'ACTIVE',
    },
    create: {
      userId: employeeUser.id,
      employeeCode: 'EMP-DEMO-002',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15550199',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: new Date('2025-06-01'),
      employmentStatus: 'ACTIVE',
    },
  });

  // Seed permissions for Employee
  const employeePermissions = [
    { resource: 'dashboard', action: 'read' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'resources', action: 'read' },
    { resource: 'leave', action: 'read' },
    { resource: 'leave', action: 'create' },
    { resource: 'payroll', action: 'read' },
  ];

  for (const perm of employeePermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_resource_action: {
          userId: employeeUser.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        userId: employeeUser.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  // Seed Salary Structure for Employee
  await prisma.salaryStructure.upsert({
    where: { employeeId: 'EMP-DEMO-002' },
    update: {
      basicSalary: 5000,
      allowances: 1000,
      deductions: 300,
      department: 'Engineering',
      designation: 'Software Engineer',
    },
    create: {
      employeeId: 'EMP-DEMO-002',
      basicSalary: 5000,
      allowances: 1000,
      deductions: 300,
      department: 'Engineering',
      designation: 'Software Engineer',
    },
  });

  // 3. Optional environment-variable custom user seeding
  const envEmail = process.env.SEED_USER_EMAIL;
  if (
    envEmail &&
    envEmail !== 'hr@dayflow.com' &&
    envEmail !== 'employee@dayflow.com'
  ) {
    console.log(`Seeding custom environment user: ${envEmail}...`);
    const customUser = await prisma.user.upsert({
      where: { email: envEmail },
      update: {
        passwordHash: hashedPassword,
        employeeId: 'EMP-DEMO-003',
        role: 'HR',
        emailVerified: true,
      },
      create: {
        email: envEmail,
        passwordHash: hashedPassword,
        employeeId: 'EMP-DEMO-003',
        role: 'HR',
        emailVerified: true,
      },
    });

    // Seed permissions for custom user
    for (const perm of hrPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_resource_action: {
            userId: customUser.id,
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {},
        create: {
          userId: customUser.id,
          resource: perm.resource,
          action: perm.action,
        },
      });
    }

    // Seed Salary Structure for custom user
    await prisma.salaryStructure.upsert({
      where: { employeeId: 'EMP-DEMO-003' },
      update: {
        basicSalary: 6500,
        allowances: 1500,
        deductions: 500,
        department: 'People Operations',
        designation: 'HR Manager',
      },
      create: {
        employeeId: 'EMP-DEMO-003',
        basicSalary: 6500,
        allowances: 1500,
        deductions: 500,
        department: 'People Operations',
        designation: 'HR Manager',
      },
    });
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
