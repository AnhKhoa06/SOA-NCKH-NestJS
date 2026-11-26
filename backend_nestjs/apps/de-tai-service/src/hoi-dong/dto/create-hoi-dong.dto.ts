import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ThanhVienDto {
  @IsString()
  @IsNotEmpty()
  maGV: string;

  @IsString()
  @IsNotEmpty()
  vaiTro: string;
}

export class CreateHoiDongDto {
  @IsString()
  @IsNotEmpty()
  tenHoiDong: string;

  @IsNumber()
  @IsNotEmpty()
  maDeTai: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThanhVienDto)
  thanhViens: ThanhVienDto[];
}
