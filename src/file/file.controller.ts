import { Get, Post, Put, Delete, Param, Body, Controller } from '@nestjs/common';
import { DeleteResult } from 'typeorm';

import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { FileRO } from './file.interface';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  public async findAll(): Promise<FileEntity[]> {
    return this.fileService.findAll();
  }

  @Post()
  public async create(@Body() fileData: CreateFileDto): Promise<FileEntity> {
    return this.fileService.create(fileData);
  }

  @Put(':id')
  public async update(
    @Param('id') fileId: string,
    @Body() fileData: CreateFileDto
  ) : Promise<FileRO> {
    return this.fileService.update(fileId, fileData);
  }

  @Delete(':id')
  public async delete(@Param('id') fileId: string): Promise<DeleteResult> {
    return this.fileService.delete(fileId);
  }
}
