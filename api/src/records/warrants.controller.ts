import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateWarrantDto, WarrantDto } from './dto';
import { RecordsService } from './records.service';

@Controller('warrants')
@UseGuards(JwtAuthGuard)
export class WarrantsController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  list() {
    return this.records.listWarrants();
  }

  @Post()
  create(@Body() dto: WarrantDto, @CurrentUser() user: AuthUser) {
    return this.records.createWarrant(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarrantDto, @CurrentUser() user: AuthUser) {
    return this.records.updateWarrant(id, dto, user.id);
  }
}
