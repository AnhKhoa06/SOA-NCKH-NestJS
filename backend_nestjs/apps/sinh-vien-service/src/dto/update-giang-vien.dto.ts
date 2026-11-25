import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateGiangVienDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  hoTen?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maKhoa?: string;
}
