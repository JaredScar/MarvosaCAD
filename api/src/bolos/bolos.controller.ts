import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BolosService } from './bolos.service';
import { CreateBoloDto, UpdateBoloDto } from './dto';

@Controller('bolos')
@UseGuards(JwtAuthGuard)
export class BolosController {
  constructor(private readonly bolos: BolosService) {}

  @Get()
  list() {
    return this.bolos.list();
  }

  @Post()
  create(@Body() dto: CreateBoloDto, @CurrentUser() user: AuthUser) {
    return this.bolos.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBoloDto, @CurrentUser() user: AuthUser) {
    return this.bolos.update(id, dto, user.id);
  }
}
