import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [HealthModule, AuthModule, UserModule, FileModule],
})
export class ApiModule {}
