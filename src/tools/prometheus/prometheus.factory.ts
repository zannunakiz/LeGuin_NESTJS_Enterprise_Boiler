import { AllConfigType } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import { PrometheusUseFactoryOptions } from '@willsoto/nestjs-prometheus';

async function usePrometheusFactory(
  config: ConfigService<AllConfigType>,
): Promise<PrometheusUseFactoryOptions> {
  return {
    path: config.getOrThrow('prometheus.path', { infer: true }),
  };
}

export default usePrometheusFactory;
