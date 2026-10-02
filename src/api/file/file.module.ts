import { FastifyMulterModule } from '@nest-lab/fastify-multer';
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';

@Module({
  imports: [FastifyMulterModule],
  controllers: [FileController],
})
export class FileModule {}
