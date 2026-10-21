import { Module } from '@nestjs/common';
import { BolosController } from '../bolos/bolos.controller';
import { BolosService } from '../bolos/bolos.service';
import { CallsController } from '../calls/calls.controller';
import { CallsService } from '../calls/calls.service';
import { PanicController } from '../panic/panic.controller';
import { PanicService } from '../panic/panic.service';
import { RolesGuard } from '../auth/roles.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { UnitsController } from '../units/units.controller';
import { UnitsService } from '../units/units.service';

@Module({
  imports: [RealtimeModule],
  controllers: [CallsController, UnitsController, BolosController, PanicController],
  providers: [CallsService, UnitsService, BolosService, PanicService, RolesGuard],
  exports: [CallsService, UnitsService, BolosService, PanicService],
})
export class DispatchModule {}
