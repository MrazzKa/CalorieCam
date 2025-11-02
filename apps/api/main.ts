import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global error handler (removed for now)

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CalorieCam API')
    .setDescription('AI-powered nutrition analysis API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  // Listen on 0.0.0.0 to accept connections from any network interface
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 CalorieCam API is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  
  // Get network interfaces info
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
    addresses.forEach(addr => {
      console.log(`   http://${addr}:${port}`);
    });
  }
  console.log(`   Use Windows IP (172.20.10.2) if mobile is on same network`);
}

bootstrap();
