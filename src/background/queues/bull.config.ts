import { RedisConfig } from '@/redis/redis-config.type';
import redisConfig from '@/redis/redis.config';
import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { BullConfig } from './bull-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  APP_NAME: string;

  @IsBoolean()
  @IsOptional()
  REMOVE_QUEUE_ON_COMPLETE: boolean;

  @IsNumber()
  @IsOptional()
  RETRY_ATTEMPTS_ON_FAIL: number;
}

export function getConfig() {
  return {
    prefix: process.env.APP_NAME,
    redis: redisConfig() as RedisConfig,
    defaultJobOptions: {
      removeOnComplete: process.env.REMOVE_ON_COMPLETE === 'true',
      removeOnFail: process.env.REMOVE_ON_FAIL === 'true',
      attempts: process.env.FAILED_RETRY_ATTEMPTS
        ? Number.parseInt(process.env.FAILED_RETRY_ATTEMPTS)
        : 0,
      backoff: {
        type: 'exponential', // With an exponential backoff, it will retry after 2 ^ attempts * delay milliseconds
        delay: 1000,
      },
    },
  };
}

export default registerAs<BullConfig>('queue', () => {
  console.info(`Register BullConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);
  return getConfig();
});
