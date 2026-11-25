import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNganhDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maNganh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tenNganh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  maKhoa: string;
}
