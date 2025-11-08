export interface ArticleSummaryDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readingMinutes: number | null;
  tags: string[];
  coverUrl: string | null;
  coverAlt: string | null;
  sourceName: string | null;
  publishedAt: string | null;
  viewCount: number;
}

export interface ArticleDetailDto extends ArticleSummaryDto {
  contentHtml: string | null;
  contentMd: string;
  sourceUrl: string | null;
}

export interface ArticleFeedDto {
  articles: ArticleSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
}

