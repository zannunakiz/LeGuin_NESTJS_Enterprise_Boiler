import { AllConfigType } from '@/config/config.type';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import path from 'path';

function graphqlFactory(
  configService: ConfigService<AllConfigType>,
): ApolloDriverConfig {
  return {
    autoSchemaFile: path.join(__dirname, '../generated/schema.generated.gql'),
    formatError: (...params: Parameters<ApolloDriverConfig['formatError']>) => {
      const [err] = params;
      if (
        configService.getOrThrow('app.nodeEnv', { infer: true }) !==
        'development'
      ) {
        if ('stacktrace' in err.extensions) {
          err.extensions.stacktrace = null;
        }
      }
      return err;
    },
  };
}

export default graphqlFactory;
