import { AuthConfig } from '@/api/auth/config/auth-config.type';
import { DatabaseConfig } from '@/database/config/database-config.type';
import { AwsConfig } from '@/libs/aws/aws.types';
import { MailConfig } from '@/mail/config/mail-config.type';
import { RedisConfig } from '@/redis/redis-config.type';
import { SentryConfig } from '@/tools/sentry/sentry-config.type';
import { ThrottlerConfig } from '@/tools/throttler/throttler-config.type';
import { BullConfig } from '@/worker/queues/bull-config.type';
import { AppConfig } from './app-config.type';

export type GlobalConfig = {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
  mail: MailConfig;
  sentry: SentryConfig;
  queue: BullConfig;
  throttler: ThrottlerConfig;
  aws: AwsConfig;
};
