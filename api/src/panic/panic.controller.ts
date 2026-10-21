import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PanicService } from './panic.service';

@Controller('panic')
@UseGuards(JwtAuthGuard)
export class PanicController {
  constructor(private readonly panic: PanicService) {}

  @Get()
  list() {
    return this.panic.listActive();
  }

  @Post(':id/clear')
  clear(@Param('id') id: string) {
    return this.panic.clear(id);
  }
}
