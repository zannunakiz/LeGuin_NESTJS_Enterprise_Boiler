import authConfig from '@/api/auth/config/auth.config';
import appConfig from '@/config/app.config';
import { AllConfigType } from '@/config/config.type';
import databaseConfig from '@/database/config/database.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import mailConfig from '@/mail/config/mail.config';
import redisConfig from '@/redis/redis.config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { redisStore } from 'cache-manager-ioredis-yet';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ApiModule } from './api/api.module';
import { BackgroundModule } from './background/background.module';
import bullFactory from './background/queues/bull.factory';
import graphqlFactory from './graphql/graphql.factory';
import i18nFactory from './i18n/i18n.factory';
import { MailModule } from './mail/mail.module';
import loggerFactory from './tools/logger/logger-factory';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, authConfig, mailConfig],
      envFilePath: ['.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: loggerFactory,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        return {
          store: await redisStore({
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
          }),
        };
      },
      isGlobal: true,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return new DataSource(options).initialize();
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: bullFactory,
    }),
    I18nModule.forRootAsync({
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
      useFactory: i18nFactory,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: graphqlFactory,
    }),
    BackgroundModule,
    MailModule,
    ApiModule,
  ],
})
export class AppModule {}
