import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    FileModule
  ],
})
export class AppModule {}
