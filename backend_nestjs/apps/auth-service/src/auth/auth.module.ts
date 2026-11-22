import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TaiKhoan } from './tai-khoan.entity';
import { RefreshToken } from './refresh-token.entity';
import { TaiKhoanController } from './tai-khoan.controller';
import { TaiKhoanService } from './tai-khoan.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([TaiKhoan, RefreshToken]),
  ],
  controllers: [AuthController, TaiKhoanController],
  providers: [AuthService, TaiKhoanService],
})
export class AuthModule {}
