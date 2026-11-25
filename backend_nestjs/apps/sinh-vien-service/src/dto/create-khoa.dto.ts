import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateKhoaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maKhoa: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenKhoa: string;
}
