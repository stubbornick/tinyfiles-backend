import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import { FileController } from './file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FileService],
  controllers: [
    FileController
  ],
  exports: []
})
export class FileModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    // empty
  }
}
