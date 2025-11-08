import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min, ValidateNested } from 'class-validator';

const ALLOWED_DATA_TYPES = ['Branded', 'Foundation', 'Survey (FNDDS)', 'SR Legacy'] as const;

export class SearchFoodsDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  query!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ALLOWED_DATA_TYPES, { each: true })
  dataType?: typeof ALLOWED_DATA_TYPES[number][];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageNumber?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  brandOwner?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'dataType.keyword' | 'lowercaseDescription.keyword' | 'fdcId' | 'publishedDate';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

