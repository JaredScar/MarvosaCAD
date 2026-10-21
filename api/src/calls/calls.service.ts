import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/auth-user';
import { rethrowKnown } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { callInclude } from './call-include';
import { CreateCallDto, UpdateCallDto } from './dto';

interface CreateOptions {
  source?: string;
  note?: string;
  noteAuthor?: string;
  posX?: number | null;
  posY?: number | null;
  posZ?: number | null;
  actorId?: string | null;
}

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  list(openOnly = false) {
    return this.prisma.call.findMany({
      where: openOnly ? { status: { not: 'closed' } } : undefined,
      orderBy: { number: 'desc' },
      include: callInclude,
      take: openOnly ? 40 : undefined,
    });
  }

  async get(id: string) {
    const call = await this.prisma.call.findUnique({ where: { id }, include: callInclude });
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  async create(dto: CreateCallDto, actor?: AuthUser, options?: CreateOptions) {
    const number = await this.nextNumber();
    try {
      const created = await this.prisma.call.create({
        data: {
          number,
          type: dto.type,
          priority: dto.priority,
          title: dto.title.trim(),
          description: dto.description.trim(),
          location: dto.location.trim(),
          postal: blankToNull(dto.postal),
          caller: blankToNull(dto.caller),
          status: 'pending',
          source: options?.source ?? 'console',
          posX: options?.posX ?? null,
          posY: options?.posY ?? null,
          posZ: options?.posZ ?? null,
          createdBy: actor?.name ?? options?.noteAuthor ?? 'System',
        },
      });
      if (options?.note) {
        await this.prisma.callNote.create({
          data: {
            callId: created.id,
            author: options.noteAuthor ?? actor?.name ?? 'System',
            body: options.note,
          },
        });
      }
      const call = await this.get(created.id);
      this.realtime.broadcast('call', {
        action: 'upsert',
        reason: 'create',
        actorId: options?.actorId === undefined ? (actor?.id ?? null) : options.actorId,
        data: call,
      });
      return call;
    } catch (error) {
      rethrowKnown(error, 'Call');
    }
  }

  async update(id: string, dto: UpdateCallDto, actor?: AuthUser) {
    await this.get(id);
    const data: Prisma.CallUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.location !== undefined) data.location = dto.location.trim();
    if (dto.postal !== undefined) data.postal = blankToNull(dto.postal);
    if (dto.caller !== undefined) data.caller = blankToNull(dto.caller);
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.closedAt = dto.status === 'closed' ? new Date() : null;
    }
    await this.prisma.call.update({ where: { id }, data });
    const call = await this.get(id);
    this.realtime.broadcast('call', { action: 'upsert', reason: 'update', actorId: actor?.id ?? null, data: call });
    return call;
  }

  async addNote(id: string, body: string, author: string, actorId: string | null) {
    await this.get(id);
    await this.prisma.callNote.create({ data: { callId: id, author, body: body.trim() } });
    const call = await this.get(id);
    this.realtime.broadcast('call', { action: 'upsert', reason: 'update', actorId, data: call });
    return call;
  }

  async assign(id: string, unitId: string, actor?: AuthUser) {
    const call = await this.get(id);
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    try {
      await this.prisma.assignment.create({ data: { callId: id, unitId } });
    } catch (error) {
      rethrowKnown(error, 'Assignment');
    }
    if (call.status === 'pending') {
      await this.prisma.call.update({ where: { id }, data: { status: 'dispatched' } });
    }
    const updated = await this.get(id);
    this.realtime.broadcast('call', { action: 'upsert', reason: 'update', actorId: actor?.id ?? null, data: updated });
    return updated;
  }

  async unassign(id: string, unitId: string, actor?: AuthUser) {
    await this.get(id);
    await this.prisma.assignment.deleteMany({ where: { callId: id, unitId } });
    const updated = await this.get(id);
    this.realtime.broadcast('call', { action: 'upsert', reason: 'update', actorId: actor?.id ?? null, data: updated });
    return updated;
  }

  private async nextNumber() {
    const aggregate = await this.prisma.call.aggregate({ _max: { number: true } });
    return (aggregate._max.number ?? 1000) + 1;
  }
}

function blankToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
