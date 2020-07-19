import { Get, Post, Put, Delete, Param, Body, Controller } from '@nestjs/common';

import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async findAll(): Promise<FileEntity[]> {
    return this.fileService.findAll();
  }

  @Post()
  async create(@Body('file') fileData: CreateFileDto) {
    return this.fileService.create(fileData);
  }

  @Put(':id')
  async update(@Param() params, @Body('file') fileData: CreateFileDto) {
    return this.fileService.update(params.id, fileData);
  }

  @Delete(':id')
  async delete(@Param() params) {
    return this.fileService.delete(params.id);
  }
}
