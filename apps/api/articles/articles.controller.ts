import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Articles')
@Controller('articles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get articles feed' })
  @ApiResponse({ status: 200, description: 'Articles feed retrieved' })
  getFeed(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.articlesService.getFeed(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured articles' })
  @ApiResponse({ status: 200, description: 'Featured articles retrieved' })
  getFeatured() {
    return this.articlesService.getFeatured();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search articles' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!query) {
      return { articles: [], page: 1, pageSize: 20, total: 0 };
    }
    return this.articlesService.search(
      query,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get('tag/:tag')
  @ApiOperation({ summary: 'Get articles by tag' })
  @ApiResponse({ status: 200, description: 'Articles by tag retrieved' })
  getByTag(
    @Param('tag') tag: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.articlesService.getByTag(
      tag,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get article by slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  getBySlug(@Param('slug') slug: string) {
    return this.articlesService.getBySlug(slug);
  }
}

