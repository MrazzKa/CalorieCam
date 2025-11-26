import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './src/core/middleware/error-handler.middleware';

function resolveCorsOrigins(): string | string[] {
  const multi = process.env.CORS_ORIGINS;
  if (multi && multi.trim().length > 0) {
    return multi
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim().length > 0) {
    return process.env.CORS_ORIGIN.trim();
  }
  return '*';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('EatSense API')
    .setDescription('AI-powered nutrition analysis API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log('========================================');
  console.log(`🚀 EatSense API is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API Base URL: ${process.env.API_BASE_URL || 'not set'}`);
  console.log('========================================');

  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname]?.forEach((iface: any) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  console.log(`🌐 Accessible on:`);
  console.log(`   http://localhost:${port} (local)`);
  if (addresses.length > 0) {
    addresses.forEach((addr) => {
      console.log(`   http://${addr}:${port}`);
    });
  }
  console.log(`   Use Windows IP (172.20.10.2) if mobile is on same network`);
}

bootstrap().catch((error) => {
  console.error('========================================');
  console.error('❌ Failed to start EatSense API');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('========================================');
  process.exit(1);
});
