import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNganhDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenNganh?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maKhoa?: string;
}
