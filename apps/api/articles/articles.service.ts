import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../src/cache/cache.service';
import { ArticleDetailDto, ArticleFeedDto } from './dto/article.dto';
import { mapArticleToDetail, mapArticleToSummary } from './article.mapper';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private buildSummarySelect() {
    return {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      tags: true,
      coverUrl: true,
      coverAlt: true,
      sourceName: true,
      readingMinutes: true,
      createdAt: true,
      publishedAt: true,
      viewCount: true,
    } as const;
  }

  async getFeed(page = 1, pageSize = 20): Promise<ArticleFeedDto> {
    const cacheKey = `feed:${page}:${pageSize}`;
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({ where: { isPublished: true } }),
    ]);

    const payload: ArticleFeedDto = {
      articles: articles.map(mapArticleToSummary),
      page,
      pageSize,
      total,
    };
    await this.cache.set(cacheKey, payload, 'articles:list');
    return payload;
  }

  async getFeatured() {
    const cacheKey = 'featured';
    const cached = await this.cache.get<ArticleFeedDto['articles']>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const articles = await this.prisma.article.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: this.buildSummarySelect(),
    });

    const summaries = articles.map(mapArticleToSummary);
    await this.cache.set(cacheKey, summaries, 'articles:list');
    return summaries;
  }

  async getBySlug(slug: string): Promise<ArticleDetailDto> {
    const cacheKey = slug;
    const cached = await this.cache.get<ArticleDetailDto>(cacheKey, 'articles:detail');
    if (cached) {
      return cached;
    }

    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article || !article.isPublished) {
      throw new NotFoundException('Article not found');
    }

    this.prisma.article
      .update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => console.error('Error incrementing view count:', err));

    const detail = mapArticleToDetail(article);
    await this.cache.set(cacheKey, detail, 'articles:detail');
    return detail;
  }

  async search(query: string, page: number = 1, pageSize: number = 20): Promise<ArticleFeedDto> {
    const cacheKey = this.buildSearchKey(query, page, pageSize);
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { contentMd: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { contentMd: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
      }),
    ]);

    const payload: ArticleFeedDto = {
      articles: articles.map(mapArticleToSummary),
      page,
      pageSize,
      total,
    };

    await this.cache.set(cacheKey, payload, 'articles:list');

    return payload;
  }

  async getByTag(tag: string, page: number = 1, pageSize: number = 20): Promise<ArticleFeedDto> {
    const cacheKey = this.buildTagKey(tag, page, pageSize);
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          isPublished: true,
          tags: { has: tag },
        },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({
        where: {
          isPublished: true,
          tags: { has: tag },
        },
      }),
    ]);

    const payload: ArticleFeedDto = {
      articles: articles.map(mapArticleToSummary),
      page,
      pageSize,
      total,
    };

    await this.cache.set(cacheKey, payload, 'articles:list');

    return payload;
  }

  private buildSearchKey(query: string, page: number, pageSize: number) {
    const hash = crypto.createHash('sha1').update(`${query}:${page}:${pageSize}`).digest('hex');
    return `search:${hash}`;
  }

  private buildTagKey(tag: string, page: number, pageSize: number) {
    const hash = crypto.createHash('sha1').update(`${tag}:${page}:${pageSize}`).digest('hex');
    return `tag:${hash}`;
  }
}

