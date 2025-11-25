import { Article } from '@prisma/client';
import { ArticleDetailDto, ArticleSummaryDto } from './dto/article.dto';

export const mapArticleToSummary = (article: Partial<Article>): ArticleSummaryDto => ({
  id: article.id!,
  slug: article.slug!,
  locale: article.locale || 'ru',
  title: article.title!,
  subtitle: article.subtitle ?? null,
  excerpt: article.excerpt ?? null,
  readingMinutes: article.readingMinutes ?? null,
  tags: article.tags ?? [],
  heroImageUrl: article.heroImageUrl ?? article.coverUrl ?? null, // Use heroImageUrl, fallback to coverUrl for backward compatibility
  coverUrl: article.coverUrl ?? article.heroImageUrl ?? null, // Legacy field (kept for backward compatibility)
  coverAlt: article.coverAlt ?? null,
  sourceName: article.sourceName ?? null,
  publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
  viewCount: article.viewCount ?? 0,
});

export const mapArticleToDetail = (article: Article): ArticleDetailDto => ({
  ...mapArticleToSummary(article),
  contentHtml: article.contentHtml ?? null,
  bodyMarkdown: article.bodyMarkdown || article.contentMd || '', // Use bodyMarkdown, fallback to contentMd for backward compatibility
  contentMd: article.contentMd ?? article.bodyMarkdown ?? null, // Legacy field (kept for backward compatibility)
  sourceUrl: article.sourceUrl ?? null,
});

