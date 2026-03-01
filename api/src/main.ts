import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  const trustProxy = config.get<boolean | number>('auth.trustProxy') || false;
  if (trustProxy) {
    app.getHttpAdapter()
      .getInstance()
      .set('trust proxy', trustProxy === true ? 1 : trustProxy);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: config.get<string[]>('auth.corsAllowedOrigins') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lexio API')
    .setDescription('Legal case management platform API')
    .setVersion('1.0')
    .addTag('Cases', 'Legal case file management')
    .addTag('Document Deliveries', 'Document upload and listing')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/swagger`, app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Lexio API running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(
    `Swagger docs available at: http://localhost:${port}/${globalPrefix}/swagger`,
  );
}

bootstrap();
