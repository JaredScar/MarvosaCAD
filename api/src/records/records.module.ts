import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { PeopleController } from './people.controller';
import { RecordsService } from './records.service';
import { VehiclesController } from './vehicles.controller';
import { WarrantsController } from './warrants.controller';

@Module({
  imports: [RealtimeModule],
  controllers: [PeopleController, VehiclesController, WarrantsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
