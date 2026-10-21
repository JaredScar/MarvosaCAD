import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CallsService } from './calls.service';
import { AssignUnitDto, CreateCallDto, NoteDto, UpdateCallDto } from './dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  list() {
    return this.calls.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.calls.get(id);
  }

  @Post()
  create(@Body() dto: CreateCallDto, @CurrentUser() user: AuthUser) {
    return this.calls.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCallDto, @CurrentUser() user: AuthUser) {
    return this.calls.update(id, dto, user);
  }

  @Post(':id/notes')
  note(@Param('id') id: string, @Body() dto: NoteDto, @CurrentUser() user: AuthUser) {
    return this.calls.addNote(id, dto.body, user.name, user.id);
  }

  @Post(':id/assignments')
  assign(@Param('id') id: string, @Body() dto: AssignUnitDto, @CurrentUser() user: AuthUser) {
    return this.calls.assign(id, dto.unitId, user);
  }

  @Delete(':id/assignments/:unitId')
  unassign(@Param('id') id: string, @Param('unitId') unitId: string, @CurrentUser() user: AuthUser) {
    return this.calls.unassign(id, unitId, user);
  }
}
