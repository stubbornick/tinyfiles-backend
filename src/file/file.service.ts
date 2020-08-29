import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Base58 from 'base-58';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import * as diskusage from 'diskusage';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DeleteResult,Repository } from 'typeorm';
import { inspect } from 'util';

import { FileCreateRequestDto } from './dto/file-create.request.dto';
import { FileResponseDto } from './dto/file.response.dto';
import { FileEntity } from './file.entity';

const generateFileId = () => Base58.encode(randomBytes(5));

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  private readonly filesDirectory = process.env.FILES_DIR || 'data/files';

  private readonly maxFileSize = Number.parseInt(
    process.env.MAX_FILE_SIZE,
    10,
  ) || 1024*1024*1024*5; // 5GB

  private readonly reservedSize = Number.parseInt(
    process.env.RESERVED_SIZE,
    10,
  ) || 1024*1024*100; // 100Mb

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

  public async findAll(): Promise<FileResponseDto[]> {
    const files = await this.fileRepository.find();

    return Promise.all(files.map(async (file) => {
      const dto = plainToClass(FileResponseDto, file);
      dto.uploadedSize = await this.getUploadedFileSize(file.id);
      return dto;
    }));
  }

  public async create(fileData: FileCreateRequestDto): Promise<FileResponseDto> {
    if (fileData.size > this.maxFileSize) {
      throw new BadRequestException(
        `File exceeded maximum size: ${this.maxFileSize}`,
      );
    }

    const diskUsage = (await diskusage.check(this.filesDirectory));
    const availableSpace = diskUsage.available - this.reservedSize;
    if (fileData.size > availableSpace) {
      this.logger.error(
        'Not enought disk space to store user\'s file. '
        + `File size/disk available: ${fileData.size}/${availableSpace}`,
      );

      throw new BadRequestException('File is too large');
    }

    const file = plainToClass(FileEntity, fileData);
    file.id = generateFileId();
    await this.fileRepository.insert(file);
    const dto = plainToClass(FileResponseDto, file);
    dto.uploadedSize = 0;
    return dto;
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
  ): Promise<FileResponseDto> {
    let fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    if (fileEntity.uploadedAt) {
      throw new BadRequestException(
        `File with id = '${fileId}' is already uploaded`
      );
    }

    let uploadedSize = await this.getUploadedFileSize(fileId);

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

    const filePath = this.getFilePath(fileId);
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
        uploadedAt: new Date()
      });
    }

    const dto = plainToClass(FileResponseDto, fileEntity);
    dto.uploadedSize = uploadedSize;
    return dto;
  }

  public async download(fileId: string, response: Response): Promise<void> {
    const fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    if (!fileEntity.uploadedAt) {
      throw new BadRequestException(`File with id = '${fileId}' is not uploaded`);
    }

    response.sendFile(fileId, {
      root: this.filesDirectory,
      headers: {
        'Content-Disposition': 'attachment',
      }
    });
  }

  private getFilePath(fileId: string): string {
    return path.join(this.filesDirectory, fileId);
  }

  private async getUploadedFileSize(fileId: string): Promise<number> {
    const filePath = this.getFilePath(fileId);

    try {
      await fs.promises.access(filePath);
    } catch (error) {
      return 0;
    }

    const stats = await fs.promises.stat(filePath);
    return stats.size;
  };
}
