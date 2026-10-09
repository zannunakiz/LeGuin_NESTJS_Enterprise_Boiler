import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import process from 'node:process';
import { PrometheusConfig } from './prometheus-config.type';

class PrometheusValidator {
  @IsString()
  @IsOptional()
  PROMETHEUS_PATH: string;
}

export function getConfig(): PrometheusConfig {
  let path = process.env.PROMETHEUS_PATH;
  if (path?.startsWith('/')) {
    path = path.slice(1);
  }
  return {
    path: path ?? 'metrics',
  };
}

export default registerAs<PrometheusConfig>('prometheus', () => {
  // eslint-disable-next-line no-console
  console.info(`Registering PrometheusConfig from environment variables`);
  validateConfig(process.env, PrometheusValidator);
  return getConfig();
});
