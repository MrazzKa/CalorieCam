import { Article } from '@prisma/client';
import { ArticleDetailDto, ArticleSummaryDto } from './dto/article.dto';

export const mapArticleToSummary = (article: Partial<Article>): ArticleSummaryDto => ({
  id: article.id!,
  slug: article.slug!,
  title: article.title!,
  excerpt: article.excerpt ?? null,
  readingMinutes: article.readingMinutes ?? null,
  tags: article.tags ?? [],
  coverUrl: article.coverUrl ?? null,
  coverAlt: article.coverAlt ?? null,
  sourceName: article.sourceName ?? null,
  publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
  viewCount: article.viewCount ?? 0,
});

export const mapArticleToDetail = (article: Article): ArticleDetailDto => ({
  ...mapArticleToSummary(article),
  contentHtml: article.contentHtml ?? null,
  contentMd: article.contentMd,
  sourceUrl: article.sourceUrl ?? null,
});

