import { IsOptional, IsString } from 'class-validator';

export class QueryDangKyDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  maDeTai?: string;

  @IsOptional()
  @IsString()
  trangThai?: string;

  // Chỉ có tác dụng với GV và QTV; sinh viên luôn chỉ thấy của mình
  @IsOptional()
  @IsString()
  maSV?: string;
}
