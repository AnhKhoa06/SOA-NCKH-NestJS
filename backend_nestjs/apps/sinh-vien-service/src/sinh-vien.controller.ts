import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Roles, RolesGuard } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { SinhVienService } from './sinh-vien.service';
import { CreateSinhVienDto } from './dto/create-sinh-vien.dto';
import { UpdateSinhVienDto } from './dto/update-sinh-vien.dto';
import { QuerySinhVienDto } from './dto/query-sinh-vien.dto';

@UseGuards(RolesGuard)
@Controller('sinh-vien')
export class SinhVienController {
  constructor(private readonly sinhVienService: SinhVienService) {}

  @Roles('QTV')
  @Post()
  create(@Body() data: CreateSinhVienDto) {
    return this.sinhVienService.create(data);
  }

  @Roles('QTV')
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
          callback(new BadRequestException('Chỉ chấp nhận file .xlsx'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên file Excel');
    }
    return this.sinhVienService.importFromExcel(file);
  }

  @Get()
  findAll(
    @Query() q: QuerySinhVienDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.sinhVienService.findAll(q, user);
  }

  @Get(':MaSV')
  findOne(
    @Param('MaSV') MaSV: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (user.role === 'SV' && user.maDinhDanh !== MaSV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Chỉ được xem hồ sơ của chính mình',
      });
    }
    return this.sinhVienService.findOne(MaSV);
  }

  @Roles('QTV')
  @Patch(':MaSV')
  update(@Param('MaSV') MaSV: string, @Body() data: UpdateSinhVienDto) {
    return this.sinhVienService.update(MaSV, data);
  }

  @Roles('QTV')
  @Delete(':MaSV')
  remove(@Param('MaSV') MaSV: string) {
    return this.sinhVienService.remove(MaSV);
  }
}
