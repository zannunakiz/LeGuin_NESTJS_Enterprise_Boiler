import { AwsS3Service } from '@/libs/aws/aws-s3.service';
import { File } from '@nest-lab/fastify-multer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  async uploadFile(file: File) {
    return this.awsS3Service.uploadFile(file, {
      filename: file.originalname,
    });
  }
}
