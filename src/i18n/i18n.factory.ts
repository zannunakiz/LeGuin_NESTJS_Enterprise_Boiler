import { AllConfigType } from '@/config/config.type';
import { Environment } from '@/constants/app.constant';
import { ConfigService } from '@nestjs/config';
import { I18nOptionsWithoutResolvers } from 'nestjs-i18n';
import path from 'path';

function useI18nFactory(
  configService: ConfigService<AllConfigType>,
): I18nOptionsWithoutResolvers {
  const env = configService.get('app.nodeEnv', { infer: true });
  const isLocal = env === Environment.LOCAL;
  const isDevelopment = env === Environment.DEVELOPMENT;
  return {
    fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
      infer: true,
    }),
    loaderOptions: {
      path: path.join(__dirname, './translations/'),
      watch: isLocal,
    },
    typesOutputPath: path.join(
      __dirname,
      '../../src/generated/i18n.generated.ts',
    ),
    logging: isLocal || isDevelopment,
  };
}

export default useI18nFactory;
