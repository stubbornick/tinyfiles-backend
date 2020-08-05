import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import * as Base58 from 'base-58';
import { randomBytes } from 'crypto';

import { FileEntity } from './file.entity';
import { FileRO } from './file.interface';
import { CreateFileDto } from './dto/create-file.dto';

const generateFileId = () => Base58.encode(randomBytes(5));

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>
  ) {}

  public async findAll(): Promise<FileEntity[]> {
    return this.fileRepository.find();
  }

  public async create(fileData: CreateFileDto): Promise<FileEntity> {
    const file = new FileEntity();
    file.id = generateFileId();
    file.name = fileData.name;

    const newFile = await this.fileRepository.save(file);

    return newFile;
  }

  public async update(fileId: string, fileData: CreateFileDto): Promise<FileRO> {
    const toUpdate = await this.fileRepository.findOne({ id: fileId });
    toUpdate.name = fileData.name;
    const file = await this.fileRepository.save(toUpdate);
    return { file };
  }

  public async delete(fileId: string): Promise<DeleteResult> {
    return this.fileRepository.delete({ id: fileId });
  }
}
