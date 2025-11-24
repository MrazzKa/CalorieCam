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
      locale: true,
      title: true,
      subtitle: true,
      excerpt: true,
      tags: true,
      heroImageUrl: true,
      coverUrl: true,
      coverAlt: true,
      sourceName: true,
      readingMinutes: true,
      createdAt: true,
      publishedAt: true,
      viewCount: true,
    } as const;
  }

  async getFeed(page = 1, pageSize = 20, locale = 'ru'): Promise<ArticleFeedDto> {
    const cacheKey = `feed:${locale}:${page}:${pageSize}`;
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          locale,
          isActive: true,
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
          ],
        },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({
        where: {
          locale,
          isActive: true,
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
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

  async getFeatured(limit = 10, locale = 'ru') {
    const cacheKey = `featured:${locale}:${limit}`;
    const cached = await this.cache.get<ArticleFeedDto['articles']>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const articles = await this.prisma.article.findMany({
      where: {
        locale,
        isActive: true,
        isFeatured: true,
        OR: [
          { isPublished: true }, // Backward compatibility
          { isActive: true },
        ],
      },
      orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
      take: limit,
      select: this.buildSummarySelect(),
    });

    const summaries = articles.map(mapArticleToSummary);
    await this.cache.set(cacheKey, summaries, 'articles:list');
    return summaries;
  }

  async getBySlug(slug: string, locale = 'ru'): Promise<ArticleDetailDto> {
    const cacheKey = `${locale}:${slug}`;
    const cached = await this.cache.get<ArticleDetailDto>(cacheKey, 'articles:detail');
    if (cached) {
      return cached;
    }

    const article = await this.prisma.article.findUnique({
      where: {
        slug_locale: {
          slug,
          locale,
        },
      },
    });

    if (!article || !article.isActive) {
      // Fallback for backward compatibility: try to find by slug only (old unique constraint)
      const legacyArticle = await this.prisma.article.findFirst({
        where: {
          slug,
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
          ],
        },
      });

      if (!legacyArticle) {
        throw new NotFoundException('Article not found');
      }

      // Update view count for legacy article
      this.prisma.article
        .update({
          where: { id: legacyArticle.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch((err) => console.error('Error incrementing view count:', err));

      const detail = mapArticleToDetail(legacyArticle);
      await this.cache.set(cacheKey, detail, 'articles:detail');
      return detail;
    }

    // Update view count
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

  async search(query: string, page: number = 1, pageSize: number = 20, locale = 'ru'): Promise<ArticleFeedDto> {
    const cacheKey = this.buildSearchKey(query, page, pageSize, locale);
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          locale,
          isActive: true,
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
          ],
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
                { subtitle: { contains: query, mode: 'insensitive' } },
                { bodyMarkdown: { contains: query, mode: 'insensitive' } },
                { contentMd: { contains: query, mode: 'insensitive' } }, // Legacy field
                { tags: { has: query } },
              ],
            },
          ],
        },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({
        where: {
          locale,
          isActive: true,
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
          ],
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
                { subtitle: { contains: query, mode: 'insensitive' } },
                { bodyMarkdown: { contains: query, mode: 'insensitive' } },
                { contentMd: { contains: query, mode: 'insensitive' } }, // Legacy field
                { tags: { has: query } },
              ],
            },
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

  async getByTag(tag: string, page: number = 1, pageSize: number = 20, locale = 'ru'): Promise<ArticleFeedDto> {
    const cacheKey = this.buildTagKey(tag, page, pageSize, locale);
    const cached = await this.cache.get<ArticleFeedDto>(cacheKey, 'articles:list');
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          locale,
          isActive: true,
          tags: { has: tag },
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
          ],
        },
        orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: pageSize,
        select: this.buildSummarySelect(),
      }),
      this.prisma.article.count({
        where: {
          locale,
          isActive: true,
          tags: { has: tag },
          OR: [
            { isPublished: true }, // Backward compatibility
            { isActive: true },
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

  private buildSearchKey(query: string, page: number, pageSize: number, locale: string) {
    const hash = crypto.createHash('sha1').update(`${locale}:${query}:${page}:${pageSize}`).digest('hex');
    return `search:${hash}`;
  }

  private buildTagKey(tag: string, page: number, pageSize: number, locale: string) {
    const hash = crypto.createHash('sha1').update(`${locale}:${tag}:${page}:${pageSize}`).digest('hex');
    return `tag:${hash}`;
  }
}

