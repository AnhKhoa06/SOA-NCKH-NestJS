import { IsInt } from 'class-validator';

// Mã sinh viên lấy từ token, không nhận từ body (phancong.md mục 3.3)
export class CreateDangKyDto {
  @IsInt()
  maDeTai: number;
}
