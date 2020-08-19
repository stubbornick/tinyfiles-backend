import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Base58 from 'base-58';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DeleteResult,Repository } from 'typeorm';
import { inspect } from 'util';

import { FileCreateRequestDto } from './dto/file-create.request.dto';
import { FileUploadResponseDto } from './dto/file-upload.response.dto';
import { FileEntity } from './file.entity';

const generateFileId = () => Base58.encode(randomBytes(5));

const getFileSize = async (filePath: string) => {
  try {
    await fs.promises.access(filePath);
  } catch (error) {
    return 0;
  }

  const stats = await fs.promises.stat(filePath);
  return stats.size;
};

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  private readonly filesDirectory = process.env.FILES_DIR || 'data/files';

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await fs.promises.access(this.filesDirectory);
    } catch(error) {
      if (error.code === 'ENOENT') {
        await fs.promises.mkdir(this.filesDirectory);
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
    await this.fileRepository.insert(file);
    return file;
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

  public async delete(fileId: string): Promise<DeleteResult> {
    const fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    const filePath = this.getFilePath(fileId);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return this.fileRepository.delete({ id: fileId });
  }

  public async upload(
    fileId: string,
    request: Request,
  ): Promise<FileUploadResponseDto> {
    let fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    if (fileEntity.uploaded_at) {
      throw new BadRequestException(
        `File with id = '${fileId}' is already uploaded`
      );
    }

    const filePath = this.getFilePath(fileId);
    let uploadedSize = await getFileSize(filePath);

    const uploadPromise: Promise<Error | null> = new Promise((resolve) => {
      request.on('data', (data) => {
        uploadedSize += data.length;

        if (uploadedSize > fileEntity.size) {
          resolve(new BadRequestException(
            'Uploaded more bytes than specified file size'
          ));
        }
      });

      request.on('end', () => {
        resolve(null);
      });

      request.on('error', (error) => {
        this.logger.error(`Upload error: ${inspect(error)}`);
        resolve(error);
      });
    });

    const fileStream = fs.createWriteStream(filePath, { flags: 'a' });
    request.pipe(fileStream);

    const uploadError = await uploadPromise;
    fileStream.close();

    if (uploadError) {
      await fs.promises.unlink(filePath);
      if (uploadError instanceof BadRequestException) {
        throw uploadError;
      }
      throw new InternalServerErrorException();
    }

    if (uploadedSize === fileEntity.size) {
      fileEntity = await this.fileRepository.save({
        id: fileId,
        uploaded_at: new Date()
      });
    }

    const dto = plainToClass(FileUploadResponseDto, fileEntity);
    dto.uploadedSize = uploadedSize;
    return dto;
  }

  public async download(fileId: string, response: Response): Promise<void> {
    const fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    if (!fileEntity.uploaded_at) {
      throw new BadRequestException(`File with id = '${fileId}' is not uploaded`);
    }

    response.sendFile(fileId, {
      root: this.filesDirectory
    });
  }

  private getFilePath(fileId: string): string {
    return path.join(this.filesDirectory, fileId);
  }
}
