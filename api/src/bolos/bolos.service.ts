import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateBoloDto, UpdateBoloDto } from './dto';

@Injectable()
export class BolosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  list() {
    return this.prisma.bolo.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] });
  }

  listActive() {
    return this.prisma.bolo.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const bolo = await this.prisma.bolo.findUnique({ where: { id } });
    if (!bolo) throw new NotFoundException('BOLO not found');
    return bolo;
  }

  async create(dto: CreateBoloDto, actorId: string | null) {
    const bolo = await this.prisma.bolo.create({
      data: {
        kind: dto.kind,
        title: dto.title.trim(),
        description: dto.description.trim(),
        subject: blankToNull(dto.subject),
        plate: dto.plate ? dto.plate.replace(/\s+/g, '').toUpperCase() : null,
        risk: dto.risk,
      },
    });
    this.realtime.broadcast('bolo', { action: 'upsert', reason: 'create', actorId, data: bolo });
    return bolo;
  }

  async update(id: string, dto: UpdateBoloDto, actorId: string | null) {
    await this.get(id);
    const data: Prisma.BoloUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.subject !== undefined) data.subject = blankToNull(dto.subject);
    if (dto.plate !== undefined) data.plate = dto.plate ? dto.plate.replace(/\s+/g, '').toUpperCase() : null;
    if (dto.risk !== undefined) data.risk = dto.risk;
    if (dto.active !== undefined) data.active = dto.active;
    const bolo = await this.prisma.bolo.update({ where: { id }, data });
    this.realtime.broadcast('bolo', { action: 'upsert', reason: 'update', actorId, data: bolo });
    return bolo;
  }
}

function blankToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
