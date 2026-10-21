import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { CALL_STATUSES, CALL_TYPES } from '../common/constants';

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsIn(CALL_TYPES)
  type!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  priority!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsOptional()
  @IsString()
  postal?: string;

  @IsOptional()
  @IsString()
  caller?: string;
}

export class UpdateCallDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(CALL_TYPES)
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  postal?: string;

  @IsOptional()
  @IsString()
  caller?: string;

  @IsOptional()
  @IsIn(CALL_STATUSES)
  status?: string;
}

export class AssignUnitDto {
  @IsString()
  @IsNotEmpty()
  unitId!: string;
}

export class NoteDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
