import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PersonDto } from './dto';
import { RecordsService } from './records.service';

@Controller('people')
@UseGuards(JwtAuthGuard)
export class PeopleController {
  constructor(private readonly records: RecordsService) {}

  @Get()
  list(@Query('q') q = '') {
    return this.records.listPeople(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.records.getPerson(id);
  }

  @Post()
  create(@Body() dto: PersonDto, @CurrentUser() user: AuthUser) {
    return this.records.createPerson(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: PersonDto, @CurrentUser() user: AuthUser) {
    return this.records.updatePerson(id, dto, user.id);
  }
}
