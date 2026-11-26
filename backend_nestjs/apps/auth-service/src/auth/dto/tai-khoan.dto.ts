import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaiKhoanDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  tenDangNhap?: string;

  @IsOptional()
  @IsString()
  matKhau?: string;

  @IsIn(['GV', 'SV'])
  vaiTro: 'GV' | 'SV';

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maDinhDanh: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hoTen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  khoaHoc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maNganh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  maKhoa?: string;

  @IsOptional()
  @IsBoolean()
  batBuocDoiMatKhau?: boolean;
}

export class DatLaiMatKhauDto {
  @IsOptional()
  @IsString()
  matKhauMoi?: string;
}

export class DoiMatKhauDto {
  @IsString()
  @IsNotEmpty()
  matKhauCu: string;

  @IsString()
  @IsNotEmpty()
  matKhauMoi: string;
}
