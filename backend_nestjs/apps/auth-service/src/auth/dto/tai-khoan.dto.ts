import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaiKhoanDto {
  @IsString() @MinLength(3) @MaxLength(100) tenDangNhap: string;
  @IsString() @IsNotEmpty() matKhau: string;
  @IsIn(['GV', 'SV']) vaiTro: 'GV' | 'SV';
  @IsString() @IsNotEmpty() @MaxLength(20) maDinhDanh: string;
}

export class DatLaiMatKhauDto {
  @IsString() @IsNotEmpty() matKhauMoi: string;
}

export class DoiMatKhauDto {
  @IsString() @IsNotEmpty() matKhauCu: string;
  @IsString() @IsNotEmpty() matKhauMoi: string;
}
