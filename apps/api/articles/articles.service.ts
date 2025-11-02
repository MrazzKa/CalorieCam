import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getFeed(page: number = 1, pageSize: number = 20) {
    const cacheKey = `articles:feed:${page}:${pageSize}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * pageSize;
    const articles = await this.prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    const result = { articles, page, pageSize, total: articles.length };
    await this.redis.set(cacheKey, JSON.stringify(result), 3600); // Cache for 1 hour
    return result;
  }

  async getFeatured() {
    const cacheKey = 'articles:featured';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const articles = await this.prisma.article.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        createdAt: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(articles), 3600);
    return articles;
  }

  async getBySlug(slug: string) {
    const cacheKey = `articles:slug:${slug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const article = await this.prisma.article.findUnique({
      where: { 
        slug,
      },
    });

    if (!article || !article.isPublished) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count (async, don't wait)
    this.prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Error incrementing view count:', err));

    await this.redis.set(cacheKey, JSON.stringify(article), 7200); // Cache for 2 hours
    return article;
  }

  async search(query: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const articles = await this.prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { contentMd: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    return { articles, page, pageSize, total: articles.length };
  }

  async getByTag(tag: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const articles = await this.prisma.article.findMany({
      where: {
        isPublished: true,
        tags: { has: tag },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    return { articles, page, pageSize, total: articles.length };
  }
}

