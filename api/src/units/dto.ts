import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DEPARTMENTS, UNIT_STATUSES, UNIT_TYPES } from '../common/constants';

export class CreateUnitDto {
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
  @IsIn(UNIT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  officerName?: string;

  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;

  @IsOptional()
  @IsIn(UNIT_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(UNIT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
