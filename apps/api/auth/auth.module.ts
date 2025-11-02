import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './guards/jwt.strategy';
import { LocalStrategy } from './guards/local.strategy';
import { PrismaModule } from '../prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    RedisModule,
    MailerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '45m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
