import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LICENSE_STATES, RECORD_STATES } from '../common/constants';

export class PersonDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  dob!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsIn(LICENSE_STATES)
  license!: string;

  @IsOptional()
  @IsString()
  flags?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VehicleDto {
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsIn(RECORD_STATES)
  insurance!: string;

  @IsIn(RECORD_STATES)
  registration!: string;

  @IsOptional()
  @IsString()
  flags?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  ownerId?: string | null;

  @IsOptional()
  @IsIn(RECORD_STATES)
  insurance?: string;

  @IsOptional()
  @IsIn(RECORD_STATES)
  registration?: string;

  @IsOptional()
  @IsString()
  flags?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WarrantDto {
  @IsString()
  @IsNotEmpty()
  personId!: string;

  @IsString()
  @IsNotEmpty()
  charge!: string;

  @IsString()
  @IsNotEmpty()
  issuedBy!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWarrantDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
