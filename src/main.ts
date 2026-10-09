import {
  ClassSerializerInterceptor,
  HttpStatus,
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
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';

import { AppModule } from './app.module';
import { getConfig as getAppConfig } from './config/app.config';
import { type GlobalConfig } from './config/config.type';
import { Environment } from './constants/app.constant';
import { WebSocketAdapter } from './shared/gateway/websocket.adapter';
import { consoleLoggingConfig } from './tools/logger/logger-factory';
import { SentryInterceptor } from './tools/sentry/sentry.interceptor';
import setupSwagger from './tools/swagger/swagger.setup';

async function bootstrap() {
  const envToLogger: Record<`${Environment}`, any> = {
    local: consoleLoggingConfig(),
    development: consoleLoggingConfig(),
    production: true,
    staging: true,
    test: false,
  } as const;

  const appConfig = getAppConfig();

  const isWorker = appConfig.isWorker;

  const app = await NestFactory.create<NestFastifyApplication>(
    isWorker ? AppModule.worker() : AppModule.main(),
    new FastifyAdapter({
      logger: appConfig.appLogging ? envToLogger[appConfig.nodeEnv] : false,
      trustProxy: appConfig.isHttps,
    }),
    {
      bufferLogs: true,
    },
  );
  const configService = app.get(ConfigService<GlobalConfig>);

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
  app.enableVersioning({
    type: VersioningType.URI,
  });

  Sentry.init({
    dsn: configService.getOrThrow('sentry.dsn', { infer: true }),
    tracesSampleRate: 1.0,
    environment: configService.getOrThrow('app.nodeEnv', { infer: true }),
  });

  app.use(helmet());
  app.enableCors({
    origin: configService.getOrThrow('app.corsOrigin', {
      infer: true,
    }),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
    credentials: true,
  });

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalInterceptors(new SentryInterceptor());

  const env = configService.getOrThrow('app.nodeEnv', { infer: true });

  if (env === 'development' || env === 'local') {
    setupSwagger(app);
  }

  if (env !== 'local') {
    setupGracefulShutdown({ app });
  }

  if (!isWorker) {
    app.useWebSocketAdapter(new WebSocketAdapter(app, configService));
  }

  await app.listen({
    port: isWorker
      ? configService.getOrThrow('app.workerPort', { infer: true })
      : configService.getOrThrow('app.port', { infer: true }),
    host: '0.0.0.0',
  });

  const httpUrl = await app.getUrl();
  const wsUrl = httpUrl
    .replace(/^http/, 'ws')
    .replace(
      `:${configService.get('app.port', { infer: true })}`,
      `:${configService.get('app.websocketPort', { infer: true })}`,
    );
  // eslint-disable-next-line no-console
  console.info(
    `\x1b[3${isWorker ? '3' : '4'}m${isWorker ? 'Worker ' : ''}Server running at ${httpUrl}`,
  );
  if (!isWorker) {
    // eslint-disable-next-line no-console
    console.info(`\x1b[34mWebsocket server running at ${wsUrl}`);
  }

  return app;
}

void bootstrap();
