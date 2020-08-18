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

const filesDirectory = process.env.FILES_DIR || 'data/files';
const generateFileId = () => Base58.encode(randomBytes(5));
const getFilePath = (fileId: string) => path.join(filesDirectory, fileId);

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

  public async upload(
    fileId: string,
    request: Request,
  ): Promise<FileUploadResponseDto> {
    const fileEntity = await this.fileRepository.findOne({ id: fileId });

    if (!fileEntity) {
      throw new NotFoundException(`File with id = '${fileId}' not found`);
    }

    if (fileEntity.uploaded_at) {
      throw new BadRequestException(
        `File with id = '${fileId}' is already uploaded`
      );
    }

    const uploadPromise = new Promise((resolve) => {
      let totalBytes = 0;

      request.on('data', (data) => {
        totalBytes += data.length;

        if (totalBytes > fileEntity.size) {
          resolve(
            new BadRequestException(
              'Uploaded more bytes than specified file size'
            )
          );
        }
      });

      request.on('end', () => {
        if (totalBytes !== fileEntity.size) {
          resolve(
            new BadRequestException(
              'Uploaded bytes count is not equal to specified file size'
            )
          );
        }

        resolve(null);
      });

      request.on('error', (error) => {
        this.logger.error(`Upload error: ${inspect(error)}`);
        resolve(error);
      });
    });

    const filePath = getFilePath(fileId);
    const fileStream = fs.createWriteStream(filePath, { flags: 'a' });
    request.pipe(fileStream);

    const uploadError = await uploadPromise;

    if (uploadError) {
      fileStream.close();
      await fs.promises.unlink(filePath);
      if (uploadError instanceof BadRequestException) {
        throw uploadError;
      }
      throw new InternalServerErrorException();
    }

    fileStream.close();

    const entity = await this.fileRepository.save({
      id: fileId,
      uploaded_at: new Date()
    });
    return plainToClass(FileUploadResponseDto, entity);
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
      root: filesDirectory
    });
  }
}
