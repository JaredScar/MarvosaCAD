import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UnitsService } from '../units/units.service';
import { RaisePanicDto } from './dto';

@Injectable()
export class PanicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly units: UnitsService,
  ) {}

  listActive() {
    return this.prisma.panicAlert.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  }

  async raise(dto: RaisePanicDto) {
    const callsign = dto.callsign.trim().toUpperCase();
    const unit = dto.unitId
      ? await this.prisma.unit.findUnique({ where: { id: dto.unitId } })
      : await this.prisma.unit.findUnique({ where: { callsign } });
    if (unit && unit.status !== 'panic') {
      const updated = await this.prisma.unit.update({
        where: { id: unit.id },
        data: { status: 'panic', location: dto.location?.trim() || unit.location },
      });
      this.units.emit(updated);
    }
    const alert = await this.prisma.panicAlert.create({
      data: {
        callsign: unit?.callsign ?? callsign,
        unitId: unit?.id,
        officerName: dto.officerName?.trim() || unit?.officerName || callsign,
        location: dto.location?.trim() || unit?.location || null,
        message: dto.message?.trim() || 'Panic button activated',
        active: true,
      },
    });
    this.realtime.broadcast('panic', { action: 'upsert', reason: 'panic', data: alert });
    return alert;
  }

  async clear(id: string) {
    const existing = await this.prisma.panicAlert.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Panic alert not found');
    const alert = await this.prisma.panicAlert.update({
      where: { id },
      data: { active: false, clearedAt: new Date() },
    });
    const unit = await this.prisma.unit.findFirst({ where: { callsign: alert.callsign, status: 'panic' } });
    if (unit) {
      const updated = await this.prisma.unit.update({ where: { id: unit.id }, data: { status: 'available' } });
      this.units.emit(updated);
    }
    this.realtime.broadcast('panic', { action: 'upsert', reason: 'clear', data: alert });
    return alert;
  }

  async deactivateCallsign(callsign: string) {
    const alerts = await this.prisma.panicAlert.findMany({ where: { callsign, active: true } });
    for (const alert of alerts) {
      const updated = await this.prisma.panicAlert.update({
        where: { id: alert.id },
        data: { active: false, clearedAt: new Date() },
      });
      this.realtime.broadcast('panic', { action: 'upsert', reason: 'clear', data: updated });
    }
  }
}
