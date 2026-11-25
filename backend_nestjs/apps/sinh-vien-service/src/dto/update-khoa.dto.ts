import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateKhoaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenKhoa?: string;
}
