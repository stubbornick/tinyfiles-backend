import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DeleteResult } from 'typeorm';

import { FileCreateRequestDto } from './dto/file-create.request.dto';
import { FileResponseDto } from './dto/file.response.dto';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  public findAll(): Promise<FileEntity[]> {
    return this.fileService.findAll();
  }

  @Post()
  public create(@Body() fileData: FileCreateRequestDto): Promise<FileEntity> {
    return this.fileService.create(fileData);
  }

  @Delete(':id')
  public delete(@Param('id') fileId: string): Promise<DeleteResult> {
    return this.fileService.delete(fileId);
  }

  @Patch('upload/:id')
  public upload(
    @Param('id') fileId: string,
    @Req() request: Request
  ): Promise<FileResponseDto> {
    return this.fileService.upload(fileId, request);
  }

  @Get('download/:id/:name')
  public async download(
    @Param('id') fileId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.fileService.download(fileId, response);
  }
}
