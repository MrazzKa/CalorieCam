import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';
import { JwksController } from './jwks.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [JwtService],
  controllers: [JwksController],
  exports: [JwtService],
})
export class JwtModule {}
