import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { TrangThaiDangKy } from '../trang-thai-dang-ky';

export class UpdateDangKyDto {
  @IsOptional()
  @IsInt()
  maDeTai?: number;

  @IsOptional()
  @IsEnum(TrangThaiDangKy)
  trangThai?: TrangThaiDangKy;
}
