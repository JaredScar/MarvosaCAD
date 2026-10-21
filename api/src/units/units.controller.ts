import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PanicService } from '../panic/panic.service';
import { CreateUnitDto, UpdateUnitDto } from './dto';
import { UnitsService } from './units.service';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(
    private readonly units: UnitsService,
    private readonly panic: PanicService,
  ) {}

  @Get()
  list() {
    return this.units.list();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateUnitDto) {
    return this.units.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    const before = await this.units.get(id);
    const unit = await this.units.update(id, dto);
    if (dto.status === 'panic' && before.status !== 'panic') {
      await this.panic.raise({
        callsign: unit.callsign,
        officerName: unit.officerName,
        location: unit.location ?? undefined,
        unitId: unit.id,
        message: 'Panic set from the console',
      });
    } else if (before.status === 'panic' && dto.status && dto.status !== 'panic') {
      await this.panic.deactivateCallsign(unit.callsign);
    }
    return this.units.get(id);
  }
}
