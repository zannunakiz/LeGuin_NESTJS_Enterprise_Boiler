import { AllConfigType } from '@/config/config.type';
import { type BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { config as bullConfig } from './bull.config';

function bullFactory(
  configService: ConfigService<AllConfigType>,
): BullRootModuleOptions {
  return {
    prefix: bullConfig.prefix,
    defaultJobOptions: bullConfig.defaultJobOptions,
    connection: {
      host: configService.getOrThrow('redis.host', {
        infer: true,
      }),
      port: configService.getOrThrow('redis.port', {
        infer: true,
      }),
      password: configService.getOrThrow('redis.password', {
        infer: true,
      }),
      tls: configService.get('redis.tlsEnabled', { infer: true }),
    },
  };
}

export default bullFactory;
