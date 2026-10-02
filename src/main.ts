import {
  ClassSerializerInterceptor,
  HttpStatus,
  RequestMethod,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from 'helmet';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';

import { AppModule } from './app.module';
import { getConfig } from './config/app.config';
import { type AllConfigType } from './config/config.type';
import { Environment } from './constants/app.constant';
import { WebSocketAdapter } from './shared/gateway/websocket.adapter';
import { consoleLoggingConfig } from './tools/logger/logger-factory';
import setupSwagger from './tools/swagger/setup-swagger';

async function bootstrap() {
  const envToLogger: Record<`${Environment}`, any> = {
    local: consoleLoggingConfig(),
    development: consoleLoggingConfig(),
    production: true,
    staging: true,
    test: false,
  } as const;

  const appConfig = getConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: appConfig.appLogging ? envToLogger[appConfig.nodeEnv] : false,
      trustProxy: appConfig.isHttps,
    }),
    {
      bufferLogs: true,
    },
  );

  // Setup security headers
  app.use(helmet());

  const configService = app.get(ConfigService<AllConfigType>);

  app.enableCors({
    origin: configService.getOrThrow('app.corsOrigin', {
      infer: true,
    }),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
    credentials: true,
  });

  // Use global prefix if you don't have subdomain
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: [
        { method: RequestMethod.GET, path: '/' },
        { method: RequestMethod.GET, path: 'health' },
      ],
    },
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(errors);
      },
    }),
  );
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const env = configService.getOrThrow('app.nodeEnv', { infer: true });

  if (env === 'development' || env === 'local') {
    setupSwagger(app);
  }

  if (env !== 'local') {
    setupGracefulShutdown({ app });
  }

  app.useWebSocketAdapter(new WebSocketAdapter(app, configService));

  await app.listen(configService.getOrThrow('app.port', { infer: true }));

  const httpUrl = await app.getUrl();
  const wsUrl = httpUrl
    .replace(/^http/, 'ws')
    .replace(
      `:${configService.get('app.port', { infer: true })}`,
      `:${configService.get('app.websocketPort', { infer: true })}`,
    );
  // eslint-disable-next-line no-console
  console.info(`Server running at ${httpUrl}`);
  // eslint-disable-next-line no-console
  console.info(`Websocket server running at ${wsUrl}`);

  return app;
}

void bootstrap();
