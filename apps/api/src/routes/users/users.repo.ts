import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminUserItemType,
  AdminUserListResponseType,
  AdminUserQueryType,
  RoleName,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(
    query: AdminUserQueryType,
  ): Promise<AdminUserListResponseType> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search?.trim();
    const role = query.role?.trim();
    const sortBy = query.sortBy || 'id';
    const sortOrder = query.sortOrder || 'desc';

    const skip = (page - 1) * limit;

    // Dùng để filter user tìm kiếm theo email hoặc displayName
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          {
            profile: {
              displayName: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    // nếu API nhận ?role=CLIENT thì chỉ lấy user có role CLIENT;
    // ?role=FREELANCER thì chỉ lấy Freelancer;
    // ?role=ADMIN thì chỉ lấy Admin;
    // ?role=CUSTOM thì lấy các role khác 3 role đó.
    if (role && role !== 'all' && role !== 'ALL') {
      if (role === 'CLIENT' || role.toLowerCase() === 'client') {
        where.userRoles = {
          some: {
            role: { name: { equals: RoleName.CLIENT, mode: 'insensitive' } },
          },
        };
      } else if (role === 'FREELANCER' || role.toLowerCase() === 'freelancer') {
        where.userRoles = {
          some: {
            role: {
              name: { equals: RoleName.FREELANCER, mode: 'insensitive' },
            },
          },
        };
      } else if (role === 'ADMIN' || role.toLowerCase() === 'admin') {
        where.userRoles = {
          some: {
            role: {
              name: { equals: RoleName.ADMIN, mode: 'insensitive' },
            },
          },
        };
      } else if (role === 'CUSTOM' || role.toLowerCase() === 'custom') {
        where.userRoles = {
          some: {
            role: {
              name: {
                notIn: [RoleName.CLIENT, RoleName.FREELANCER, RoleName.ADMIN],
                mode: 'insensitive',
              },
            },
          },
        };
      } else {
        where.userRoles = {
          some: {
            role: { name: { equals: role, mode: 'insensitive' } },
          },
        };
      }
    }

    // sort theo field được truyền vào
    let orderBy: Prisma.UserOrderByWithRelationInput = { id: sortOrder };
    if (sortBy === 'email') {
      orderBy = { email: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'displayName') {
      orderBy = { profile: { displayName: sortOrder } };
    } else {
      orderBy = { id: sortOrder };
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
            },
          },
          userRoles: {
            select: {
              isPrimary: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: AdminUserItemType[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        isPrimary: ur.isPrimary,
      })),
    }));

    return {
      users: mappedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
