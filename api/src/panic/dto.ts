import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RaisePanicDto {
  @IsString()
  @IsNotEmpty()
  callsign!: string;

  @IsOptional()
  @IsString()
  officerName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  unitId?: string;
}
