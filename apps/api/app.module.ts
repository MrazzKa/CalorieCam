import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { FoodModule } from './food/food.module';
import { MealsModule } from './meals/meals.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';
import { SessionsModule } from './sessions/sessions.module';
import { JwtModule } from './jwt/jwt.module';
import { MailerModule } from './mailer/mailer.module';
import { QueuesModule } from './queues/queues.module';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from './src/cache/cache.module';
import { WellKnownModule } from './well-known/well-known.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { UserProfilesModule } from './user-profiles/user-profiles.module';
import { HealthController } from './health.controller';
import { configSchema } from './src/config/config.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    PrismaModule,
    AuthModule,
    FoodModule,
    MealsModule,
    MediaModule,
    UsersModule,
    StatsModule,
    SessionsModule,
    JwtModule,
    MailerModule,
    QueuesModule,
    RedisModule,
    CacheModule,
    WellKnownModule,
    AiAssistantModule,
    UserProfilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
