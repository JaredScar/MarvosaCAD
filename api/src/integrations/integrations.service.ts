import { Injectable } from '@nestjs/common';
import { BolosService } from '../bolos/bolos.service';
import { CallsService } from '../calls/calls.service';
import { PanicService } from '../panic/panic.service';
import { RecordsService } from '../records/records.service';
import { UnitsService } from '../units/units.service';
import { classify } from './classify';
import { GameCallDto, GamePanicDto, HeartbeatDto } from './dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly calls: CallsService,
    private readonly units: UnitsService,
    private readonly bolos: BolosService,
    private readonly panic: PanicService,
    private readonly records: RecordsService,
  ) {}

  async createCall(dto: GameCallDto) {
    const classified = classify(dto.message);
    const reporter = dto.callsign ? `${dto.callsign} (${dto.officerName || dto.caller})` : dto.caller;
    const call = await this.calls.create(
      {
        title: dto.message.trim().slice(0, 80),
        type: classified.type,
        priority: classified.priority,
        description: dto.message.trim(),
        location: dto.street.trim(),
        caller: dto.caller.trim(),
      },
      undefined,
      {
        source: 'fivem',
        actorId: null,
        note: `Opened from FiveM by ${reporter}.`,
        noteAuthor: 'FiveM',
        posX: dto.x ?? null,
        posY: dto.y ?? null,
        posZ: dto.z ?? null,
      },
    );
    return { call };
  }

  heartbeat(dto: HeartbeatDto) {
    return this.units.heartbeat(dto);
  }

  async setStatus(dto: HeartbeatDto) {
    const unit = await this.units.heartbeat(dto);
    if (dto.status === 'panic') {
      await this.panic.raise({
        callsign: unit.callsign,
        officerName: unit.officerName,
        location: unit.location ?? undefined,
        unitId: unit.id,
        message: 'Panic set from the MDT',
      });
    } else if (dto.status) {
      await this.panic.deactivateCallsign(unit.callsign);
    }
    return this.units.findByCallsign(unit.callsign);
  }

  raisePanic(dto: GamePanicDto) {
    return this.panic.raise({
      callsign: dto.callsign,
      officerName: dto.officerName,
      location: dto.location,
      message: dto.message || 'Panic button activated',
    });
  }

  async snapshot(callsign?: string) {
    const [calls, bolos, panics, unit] = await Promise.all([
      this.calls.list(true),
      this.bolos.listActive(),
      this.panic.listActive(),
      callsign ? this.units.findByCallsign(callsign) : Promise.resolve(null),
    ]);
    return { calls, bolos, panics, unit };
  }

  plate(plate: string) {
    return this.records.findPlate(plate);
  }

  people(query: string) {
    return this.records.listPeople(query);
  }
}
