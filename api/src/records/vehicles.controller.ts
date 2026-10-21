import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateVehicleDto, VehicleDto } from './dto';
import { RecordsService } from './records.service';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  list(@Query('q') q = '') {
    return this.records.listVehicles(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.records.getVehicle(id);
  }

  @Post()
  create(@Body() dto: VehicleDto, @CurrentUser() user: AuthUser) {
    return this.records.createVehicle(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @CurrentUser() user: AuthUser) {
    return this.records.updateVehicle(id, dto, user.id);
  }
}
