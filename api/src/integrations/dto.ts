import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DEPARTMENTS, UNIT_STATUSES, UNIT_TYPES } from '../common/constants';

export class GameCallDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  caller!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsOptional()
  @IsString()
  callsign?: string;

  @IsOptional()
  @IsString()
  officerName?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  z?: number;
}

export class HeartbeatDto {
  @IsString()
  @IsNotEmpty()
  callsign!: string;

  @IsString()
  @IsNotEmpty()
  officerName!: string;

  @IsIn(DEPARTMENTS)
  department!: string;

  @IsIn(UNIT_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsIn(UNIT_STATUSES)
  status?: string;
}

export class GamePanicDto {
  @IsString()
  @IsNotEmpty()
  callsign!: string;

  @IsString()
  @IsNotEmpty()
  officerName!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
