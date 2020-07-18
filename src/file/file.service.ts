import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';

import { FileEntity } from './file.entity';
import { FileRO } from './file.interface';
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>
  ) {}

  async findAll(): Promise<FileEntity[]> {
    return await this.fileRepository.find();
  }

  async create(fileData: CreateFileDto): Promise<FileEntity> {
    const file = new FileEntity();
    file.id = this.generateId();
    file.name = fileData.name;

    const newFile = await this.fileRepository.save(file);

    return newFile;
  }

  async update(fileId: string, fileData: CreateFileDto): Promise<FileRO> {
    const toUpdate = await this.fileRepository.findOne({ id: fileId });
    const updated = Object.assign(toUpdate, fileData);
    const file = await this.fileRepository.save(updated);
    return { file };
  }

  async delete(fileId: string): Promise<DeleteResult> {
    return await this.fileRepository.delete({ id: fileId });
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 11);
  }
}
