import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { GameCallDto, GamePanicDto, HeartbeatDto } from './dto';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Post('calls')
  createCall(@Body() dto: GameCallDto) {
    return this.integrations.createCall(dto);
  }

  @Post('units/heartbeat')
  heartbeat(@Body() dto: HeartbeatDto) {
    return this.integrations.heartbeat(dto);
  }

  @Post('units/status')
  status(@Body() dto: HeartbeatDto) {
    return this.integrations.setStatus(dto);
  }

  @Post('panic')
  panic(@Body() dto: GamePanicDto) {
    return this.integrations.raisePanic(dto);
  }

  @Get('snapshot')
  snapshot(@Query('callsign') callsign?: string) {
    return this.integrations.snapshot(callsign);
  }

  @Get('plates/:plate')
  plate(@Param('plate') plate: string) {
    return this.integrations.plate(plate);
  }

  @Get('people')
  people(@Query('q') q = '') {
    return this.integrations.people(q);
  }
}
