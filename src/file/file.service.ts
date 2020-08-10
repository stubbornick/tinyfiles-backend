import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Base58 from 'base-58';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DeleteResult,Repository } from 'typeorm';
import { inspect } from 'util';

import { FileCreateRequestDto } from './dto/file-create.request.dto';
import { FileUploadResponseDto } from './dto/file-upload.response.dto';
import { FileEntity } from './file.entity';

const filesDirectory = process.env.FILES_DIR || 'data/files';
const generateFileId = () => Base58.encode(randomBytes(5));
const getFilePath = (fileId) => path.join(filesDirectory, fileId);

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await fs.promises.access(filesDirectory);
    } catch(error) {
      if (error.code === 'ENOENT') {
        await fs.promises.mkdir(filesDirectory);
        return;
      }

      throw error;
    }
  }

  public async findAll(): Promise<FileEntity[]> {
    return this.fileRepository.find();
  }

  public async create(fileData: FileCreateRequestDto): Promise<FileEntity> {
    const file = plainToClass(FileEntity, fileData);
    file.id = generateFileId();
    return this.fileRepository.save(file);
  }

  public async update(
    fileId: string,
    fileData: FileCreateRequestDto
  ): Promise<FileEntity> {
    const toUpdate = await this.fileRepository.findOne({ id: fileId });
    toUpdate.name = fileData.name;
    const file = await this.fileRepository.save(toUpdate);
    return file;
  }

  public async upload(
    fileId: string,
    request: Request,
  ): Promise<FileUploadResponseDto> {
    const fileInDb = await this.fileRepository.findOne({ id: fileId });

    if (!fileInDb) {
      throw new BadRequestException(`Cannot find file with id = '${fileId}'`);
    }

    if (fileInDb.uploaded_at) {
      throw new BadRequestException(
        `File with id = '${fileId}' is already uploaded`
      );
    }

    const uploadPromise = new Promise((resolve) => {
      request.on('end', () => {
        resolve(true);
      });

      request.on('error', (error) => {
        this.logger.error(`Upload error: ${inspect(error)}`);
        resolve(false);
      });
    });

    const filePath = getFilePath(fileId);
    const fileStream = fs.createWriteStream(filePath, { flags: 'a' });

    request.on('data', (data: Buffer) => {
      fileStream.write(data);
      console.log(`Written chunk of ${data.length} byte`);
    });

    if (!await uploadPromise) {
      fileStream.close();
      await fs.promises.unlink(filePath);
      throw new InternalServerErrorException();
    }

    fileStream.close();

    const entity = await this.fileRepository.save({
      id: fileId, uploaded_at: new Date
    });
    return plainToClass(FileUploadResponseDto, entity);
  }

  public async delete(fileId: string): Promise<DeleteResult> {
    const fileInDb = await this.fileRepository.findOne({ id: fileId });

    if (!fileInDb) {
      throw new BadRequestException(`Cannot find file with id = '${fileId}'`);
    }

    const filePath = getFilePath(fileId);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return this.fileRepository.delete({ id: fileId });
  }
}
