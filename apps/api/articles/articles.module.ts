import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PrismaModule } from '../prisma.module';
import { CacheModule } from '../src/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}

