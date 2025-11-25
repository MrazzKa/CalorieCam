export interface ArticleSummaryDto {
  id: string;
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  readingMinutes: number | null;
  tags: string[];
  heroImageUrl: string | null;
  coverUrl: string | null; // Legacy field (kept for backward compatibility)
  coverAlt: string | null;
  sourceName: string | null;
  publishedAt: string | null;
  viewCount: number;
}

export interface ArticleDetailDto extends ArticleSummaryDto {
  contentHtml: string | null;
  bodyMarkdown: string;
  contentMd: string | null; // Legacy field (kept for backward compatibility)
  sourceUrl: string | null;
}

export interface ArticleFeedDto {
  articles: ArticleSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
}

