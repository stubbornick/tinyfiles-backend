import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    FileModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
