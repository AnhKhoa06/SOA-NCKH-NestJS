import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDeTaiDto {
  @IsString()
  @IsNotEmpty()
  tenDeTai: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maGV?: string;

  @IsOptional()
  @IsString()
  giangVienHuongDan?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  soLuongToiDa?: number;
}
