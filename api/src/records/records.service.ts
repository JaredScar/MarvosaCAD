import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { rethrowKnown } from '../common/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PersonDto, UpdateVehicleDto, UpdateWarrantDto, VehicleDto, WarrantDto } from './dto';

const personInclude = {
  warrants: { orderBy: { issuedAt: 'desc' as const } },
  vehicles: { orderBy: { plate: 'asc' as const } },
} satisfies Prisma.PersonInclude;

const vehicleInclude = {
  owner: { include: { warrants: { where: { active: true } } } },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  listPeople(query = '') {
    const q = query.trim();
    return this.prisma.person.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
              { address: { contains: q } },
            ],
          }
        : undefined,
      include: personInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async getPerson(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id }, include: personInclude });
    if (!person) throw new NotFoundException('Person not found');
    return person;
  }

  async createPerson(dto: PersonDto, actorId: string | null) {
    const person = await this.prisma.person.create({ data: personData(dto), include: personInclude });
    this.realtime.broadcast('person', { action: 'upsert', reason: 'create', actorId, data: person });
    return person;
  }

  async updatePerson(id: string, dto: PersonDto, actorId: string | null) {
    await this.getPerson(id);
    const person = await this.prisma.person.update({ where: { id }, data: personData(dto), include: personInclude });
    this.realtime.broadcast('person', { action: 'upsert', reason: 'update', actorId, data: person });
    return person;
  }

  listVehicles(query = '') {
    const q = query.trim();
    const plate = q.replace(/\s+/g, '').toUpperCase();
    return this.prisma.vehicle.findMany({
      where: q
        ? {
            OR: [
              { plate: { contains: plate } },
              { model: { contains: q } },
              { color: { contains: q } },
              { flags: { contains: q } },
              { owner: { is: { lastName: { contains: q } } } },
              { owner: { is: { firstName: { contains: q } } } },
            ],
          }
        : undefined,
      include: vehicleInclude,
      orderBy: { plate: 'asc' },
    });
  }

  async getVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async findPlate(plate: string) {
    const normalized = plate.replace(/\s+/g, '').toUpperCase();
    const vehicle = await this.prisma.vehicle.findUnique({ where: { plate: normalized }, include: vehicleInclude });
    return { found: Boolean(vehicle), plate: normalized, vehicle };
  }

  async createVehicle(dto: VehicleDto, actorId: string | null) {
    try {
      const vehicle = await this.prisma.vehicle.create({
        data: {
          plate: normalizePlate(dto.plate),
          model: dto.model.trim(),
          color: dto.color.trim(),
          ownerId: blankToNull(dto.ownerId),
          insurance: dto.insurance,
          registration: dto.registration,
          flags: blankToNull(dto.flags),
          notes: blankToNull(dto.notes),
        },
        include: vehicleInclude,
      });
      this.realtime.broadcast('vehicle', { action: 'upsert', reason: 'create', actorId, data: vehicle });
      await this.broadcastOwner(vehicle.ownerId, actorId);
      return vehicle;
    } catch (error) {
      rethrowKnown(error, 'Plate');
    }
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto, actorId: string | null) {
    const existing = await this.getVehicle(id);
    const data: Prisma.VehicleUpdateInput = {};
    if (dto.model !== undefined) data.model = dto.model.trim();
    if (dto.color !== undefined) data.color = dto.color.trim();
    if (dto.insurance !== undefined) data.insurance = dto.insurance;
    if (dto.registration !== undefined) data.registration = dto.registration;
    if (dto.flags !== undefined) data.flags = blankToNull(dto.flags);
    if (dto.notes !== undefined) data.notes = blankToNull(dto.notes);
    if (dto.ownerId !== undefined) {
      data.owner = dto.ownerId ? { connect: { id: dto.ownerId } } : { disconnect: true };
    }
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data, include: vehicleInclude });
    this.realtime.broadcast('vehicle', { action: 'upsert', reason: 'update', actorId, data: vehicle });
    await this.broadcastOwner(existing.ownerId, actorId);
    await this.broadcastOwner(vehicle.ownerId, actorId);
    return vehicle;
  }

  listWarrants() {
    return this.prisma.warrant.findMany({
      include: { person: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async createWarrant(dto: WarrantDto, actorId: string | null) {
    await this.getPerson(dto.personId);
    const warrant = await this.prisma.warrant.create({
      data: {
        personId: dto.personId,
        charge: dto.charge.trim(),
        issuedBy: dto.issuedBy.trim(),
        notes: blankToNull(dto.notes),
      },
      include: { person: true },
    });
    this.realtime.broadcast('warrant', { action: 'upsert', reason: 'create', actorId, data: warrant });
    await this.broadcastOwner(dto.personId, actorId);
    return warrant;
  }

  async updateWarrant(id: string, dto: UpdateWarrantDto, actorId: string | null) {
    const existing = await this.prisma.warrant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Warrant not found');
    const warrant = await this.prisma.warrant.update({
      where: { id },
      data: {
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.notes !== undefined ? { notes: blankToNull(dto.notes) } : {}),
      },
      include: { person: true },
    });
    this.realtime.broadcast('warrant', { action: 'upsert', reason: 'update', actorId, data: warrant });
    await this.broadcastOwner(warrant.personId, actorId);
    return warrant;
  }

  private async broadcastOwner(personId: string | null, actorId: string | null) {
    if (!personId) return;
    const person = await this.prisma.person.findUnique({ where: { id: personId }, include: personInclude });
    if (person) this.realtime.broadcast('person', { action: 'upsert', reason: 'update', actorId, data: person });
  }
}

function personData(dto: PersonDto): Prisma.PersonCreateInput {
  return {
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    dob: dto.dob.trim(),
    gender: blankToNull(dto.gender),
    phone: blankToNull(dto.phone),
    address: blankToNull(dto.address),
    license: dto.license,
    flags: blankToNull(dto.flags),
    notes: blankToNull(dto.notes),
  };
}

function normalizePlate(plate: string) {
  return plate.replace(/\s+/g, '').toUpperCase();
}

function blankToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
