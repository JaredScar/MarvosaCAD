import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthUser } from '../common/auth-user';
import { rethrowKnown } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({
      include: { unit: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return users.map((user) => this.toStaff(user));
  }

  async create(dto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username.trim(),
          name: dto.name.trim(),
          role: dto.role,
          password: await bcrypt.hash(dto.password, 10),
        },
        include: { unit: true },
      });
      return this.toStaff(user);
    } catch (error) {
      rethrowKnown(error, 'Username');
    }
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { id }, include: { unit: true } });
    if (!existing) throw new NotFoundException('Account not found');
    const nextRole = dto.role ?? existing.role;
    const nextActive = dto.active ?? existing.active;
    if (dto.active === false && actor.id === id) {
      throw new BadRequestException('You cannot disable your own account');
    }
    await this.assertAdminRemains(id, nextRole, nextActive);
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.password !== undefined ? { password: await bcrypt.hash(dto.password, 10) } : {}),
        },
        include: { unit: true },
      });
      return this.toStaff(user);
    } catch (error) {
      rethrowKnown(error, 'Username');
    }
  }

  private async assertAdminRemains(id: string, role: string, active: boolean) {
    if (role === 'admin' && active) return;
    const others = await this.prisma.user.count({
      where: { role: 'admin', active: true, NOT: { id } },
    });
    if (others < 1) {
      throw new BadRequestException('MarvosaCAD needs at least one active administrator');
    }
  }

  private toStaff(user: { id: string; username: string; name: string; role: string; active: boolean; createdAt: Date; unit: { callsign: string } | null }) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      active: user.active,
      callsign: user.unit?.callsign ?? null,
      createdAt: user.createdAt,
    };
  }
}
