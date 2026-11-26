import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSinhVienDto {
  @IsOptional()
  @IsString()
  maSV?: string;

  @IsOptional()
  @IsString()
  MaSV?: string;

  @IsString()
  @IsNotEmpty()
  hoTen: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  lop?: string;

  @IsOptional()
  @IsString()
  maNganh?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(4)
  gpa?: number;
}
