import {
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Controller,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DeleteResult } from 'typeorm';

import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { FileCreateRequestDto } from './dto/file-create.request.dto';
import { FileUploadResponseDto } from './dto/file-upload.response.dto';

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

  @Patch(':id')
  public update(
    @Param('id') fileId: string,
    @Body() fileData: FileCreateRequestDto
  ) : Promise<FileEntity> {
    return this.fileService.update(fileId, fileData);
  }

  @Patch('upload/:id')
  public uploadFile(
    @Param('id') fileId: string,
    @Req() request: Request
  ): Promise<FileUploadResponseDto> {
    return this.fileService.upload(fileId, request);
  }

  @Delete(':id')
  public async delete(@Param('id') fileId: string): Promise<DeleteResult> {
    return this.fileService.delete(fileId);
  }
}
