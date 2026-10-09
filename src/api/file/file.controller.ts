/* eslint-disable no-console */
import {
  File,
  FileInterceptor,
  FilesInterceptor,
} from '@nest-lab/fastify-multer';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';

@ApiTags('file')
@Controller({
  path: 'file',
  version: '1',
})
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({ summary: 'Uploads a single file' })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Post('/upload/single')
  uploadFile(@UploadedFile() file: File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.fileService.uploadFile(file);
  }

  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploads multiple files' })
  @UseInterceptors(FilesInterceptor('files', 4))
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @Post('/upload/multiple')
  uploadFiles(@UploadedFiles() files: Array<File>) {
    if (!files.length) {
      throw new BadRequestException('Files are required.');
    }

    return console.log(files);
  }
}
