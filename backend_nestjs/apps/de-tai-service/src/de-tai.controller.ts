import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Headers,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles, RolesGuard } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { DeTaiService } from './de-tai.service';
import { CreateDeTaiDto } from './dto/create-de-tai.dto';
import { UpdateDeTaiDto } from './dto/update-de-tai.dto';

@UseGuards(RolesGuard)
@Controller('de-tai')
export class DeTaiController {
  constructor(private readonly deTaiService: DeTaiService) {}

  // POST /de-tai: chỉ GV hoặc QTV
  @Roles('GV', 'QTV')
  @Post()
  createDeTai(
    @Body() body: CreateDeTaiDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') auth?: string,
  ) {
    return this.deTaiService.createDeTai(body, user, auth);
  }

  // GET /de-tai: GV chỉ xem đề tài của mình; SV và QTV xem danh sách (hỗ trợ lọc ?maGV=)
  @Get()
  getAllDeTai(
    @CurrentUser() user: CurrentUserPayload,
    @Query('maGV') maGV?: string,
  ) {
    const filterMaGV = user.role === 'GV' ? user.maDinhDanh : maGV;
    return this.deTaiService.getAllDeTai(filterMaGV);
  }

  // GET /de-tai/:id
  @Get(':id')
  getDeTaiById(@Param('id', ParseIntPipe) id: number) {
    return this.deTaiService.findOne(id);
  }

  // PUT /de-tai/:id: chỉ GV sở hữu đề tài hoặc QTV
  @Roles('GV', 'QTV')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDeTaiDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') auth?: string,
  ) {
    return this.deTaiService.update(id, body, user, auth);
  }

  // DELETE /de-tai/:id: chỉ GV sở hữu đề tài hoặc QTV
  @Roles('GV', 'QTV')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.deTaiService.remove(id, user);
  }
}
