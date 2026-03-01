import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from '../modules/auth/auth.module';
import { AuthSessionMiddleware } from '../modules/auth/auth-session.middleware';
import { authConfig, databaseConfig, storageConfig } from '../config';
import { CasesModule } from '../modules/cases/cases.module';
import { DocumentsModule } from '../modules/documents/documents.module';
import { NotesModule } from '../modules/notes/notes.module';
import { ActivityModule } from '../modules/activity/activity.module';
import { AuditModule } from '../modules/audit/audit.module';
import { PartiesModule } from '../modules/parties/parties.module';
import { UsersModule } from '../modules/users/users.module';
import { HttpExceptionFilter } from '../shared/filters/http-exception.filter';
import { CorrelationIdMiddleware } from '../shared/middleware/correlation-id.middleware';
import { SecurityHeadersMiddleware } from '../shared/middleware/security-headers.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, databaseConfig, storageConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize') ?? false,
        logging: config.get<boolean>('database.logging') ?? false,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute (general)
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 100, // 100 requests per hour
      },
    ]),
    AuthModule,
    CasesModule,
    DocumentsModule,
    NotesModule,
    ActivityModule,
    AuditModule,
    PartiesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, CorrelationIdMiddleware, AuthSessionMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
