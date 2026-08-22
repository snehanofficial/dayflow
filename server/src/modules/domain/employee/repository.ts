import { prisma } from '../../core/database/index.js';

export class EmployeeRepository {
  async findByUserId(userId: string) {
    return prisma.employee.findUnique({
      where: { userId },
    });
  }

  async create(data: {
    userId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
    designation?: string;
    joiningDate?: Date;
    profileImage?: string | null;
    address?: string | null;
    employmentStatus?: string | null;
  }) {
    return prisma.employee.create({
      data,
    });
  }

  async updateByUserId(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
    },
  ) {
    return prisma.employee.update({
      where: { userId },
      data,
    });
  }

  async findAll() {
    return prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
    });
  }

  async updateById(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      department?: string | null;
      designation?: string | null;
      joiningDate?: Date | null;
      profileImage?: string | null;
      address?: string | null;
      employmentStatus?: string | null;
    },
  ) {
    return prisma.employee.update({
      where: { id },
      data,
    });
  }
}
