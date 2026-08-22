import { EmployeeRepository } from './repository.js';
import { NotFoundError } from '../../core/errors/index.js';

export class EmployeeService {
  private repository = new EmployeeRepository();

  async getOrCreateProfile(userId: string, employeeCode: string) {
    let profile = await this.repository.findByUserId(userId);
    if (!profile) {
      profile = await this.repository.create({
        userId,
        employeeCode,
        firstName: '',
        lastName: '',
      });
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    employeeCode: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
    },
  ) {
    // Ensure profile exists first
    await this.getOrCreateProfile(userId, employeeCode);
    return this.repository.updateByUserId(userId, data);
  }

  async getAllProfiles() {
    return this.repository.findAll();
  }

  async getProfileById(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new NotFoundError('Employee profile not found');
    }
    return profile;
  }

  async updateEmployeeProfile(
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
    await this.getProfileById(id);
    return this.repository.updateById(id, data);
  }
}
