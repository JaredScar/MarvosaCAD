import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BOLO_KINDS, BOLO_RISKS } from '../common/constants';

export class CreateBoloDto {
  @IsIn(BOLO_KINDS)
  kind!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsIn(BOLO_RISKS)
  risk!: string;
}

export class UpdateBoloDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsIn(BOLO_RISKS)
  risk?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
