export interface ArticleSummary {
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

export interface ArticleDetail extends ArticleSummary {
  contentHtml: string | null;
  contentMd: string;
  sourceUrl: string | null;
}

export interface ArticleFeed {
  articles: ArticleSummary[];
  page: number;
  pageSize: number;
  total: number;
}
