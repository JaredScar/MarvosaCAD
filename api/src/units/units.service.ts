import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Unit } from '@prisma/client';
import { rethrowKnown } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateUnitDto, UpdateUnitDto } from './dto';

export interface HeartbeatInput {
  callsign: string;
  officerName: string;
  department: string;
  type: string;
  status?: string;
  location?: string;
  identifier?: string;
}

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  list() {
    return this.prisma.unit.findMany({ orderBy: { callsign: 'asc' } });
  }

  async get(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  findByCallsign(callsign: string) {
    return this.prisma.unit.findUnique({ where: { callsign: normalizeCallsign(callsign) } });
  }

  async create(dto: CreateUnitDto) {
    try {
      const unit = await this.prisma.unit.create({
        data: {
          callsign: normalizeCallsign(dto.callsign),
          officerName: dto.officerName.trim(),
          department: dto.department,
          type: dto.type,
          status: dto.status ?? 'available',
          location: blankToNull(dto.location),
        },
      });
      this.emit(unit);
      return unit;
    } catch (error) {
      rethrowKnown(error, 'Callsign');
    }
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.get(id);
    const data: Prisma.UnitUpdateInput = {};
    if (dto.officerName !== undefined) data.officerName = dto.officerName.trim();
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.location !== undefined) data.location = blankToNull(dto.location);
    const unit = await this.prisma.unit.update({ where: { id }, data });
    this.emit(unit);
    return unit;
  }

  async heartbeat(input: HeartbeatInput) {
    const callsign = normalizeCallsign(input.callsign);
    const existing = await this.prisma.unit.findUnique({ where: { callsign } });
    const location = blankToNull(input.location);
    try {
      const unit = existing
        ? await this.prisma.unit.update({
            where: { id: existing.id },
            data: {
              officerName: input.officerName.trim() || existing.officerName,
              department: input.department || existing.department,
              type: input.type || existing.type,
              location: location ?? existing.location,
              identifier: input.identifier ?? existing.identifier,
              ...(input.status ? { status: input.status } : {}),
            },
          })
        : await this.prisma.unit.create({
            data: {
              callsign,
              officerName: input.officerName.trim() || callsign,
              department: input.department,
              type: input.type,
              status: input.status ?? 'available',
              location,
              identifier: input.identifier,
            },
          });
      this.emit(unit);
      return unit;
    } catch (error) {
      rethrowKnown(error, 'Callsign');
    }
  }

  emit(unit: Unit) {
    this.realtime.broadcast('unit', { action: 'upsert', reason: 'update', data: unit });
  }
}

function normalizeCallsign(value: string) {
  return value.trim().toUpperCase();
}

function blankToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
