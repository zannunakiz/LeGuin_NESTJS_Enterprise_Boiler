/* eslint-disable no-console */
import { FileInterceptor, FilesInterceptor } from '@nest-lab/fastify-multer';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('files')
@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor() {}

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
  @Post('/single')
  singleFile(@UploadedFile() file: File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    // eslint-disable-next-line no-console
    return console.log(file);
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
  @Post('/multiple')
  multipleFiles(@UploadedFiles() files: Array<File>) {
    if (!files.length) {
      throw new BadRequestException('Files are required.');
    }
    // eslint-disable-next-line no-console
    return console.log(files);
  }
}
