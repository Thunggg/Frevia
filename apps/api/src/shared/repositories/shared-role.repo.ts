import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class SharedRoleRepository {
  private clientRoleId: null | number = null;
  private adminRoleId: null | number = null;
  private freelancerRoleId: null | number = null;

  constructor(private readonly prisma: PrismaService) {}

  async getClientRoleId() {
    if (this.clientRoleId) return this.clientRoleId;

    const role = await this.prisma.role.findFirst({
      where: { name: RoleName.CLIENT, deletedAt: null },
    });

    if (!role) {
      throw new Error('Client role not found!');
    }

    this.clientRoleId = role.id;
    return this.clientRoleId;
  }

  async getFreelancerRoleId() {
    if (this.freelancerRoleId) return this.freelancerRoleId;

    const role = await this.prisma.role.findFirst({
      where: { name: RoleName.FREELANCER, deletedAt: null },
    });

    if (!role) {
      throw new Error('Freelancer role not found!');
    }

    this.freelancerRoleId = role.id;
    return this.freelancerRoleId;
  }

  async getAdminRoleId() {
    if (this.adminRoleId) return this.adminRoleId;

    const role = await this.prisma.role.findFirst({
      where: { name: RoleName.ADMIN, deletedAt: null },
    });

    if (!role) {
      throw new Error('Admin role not found!');
    }

    this.adminRoleId = role.id;
    return this.adminRoleId;
  }
}
