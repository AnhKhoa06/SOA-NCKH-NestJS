import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGiangVienDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maGV: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  hoTen: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maKhoa: string;
}
