import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TuChoiDangKyDto {
  // Kiểm tra rỗng làm trong service để trả đúng mã THIEU_LY_DO
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lyDo?: string;
}
