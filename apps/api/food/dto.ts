import { IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  image: any;

  @ApiProperty({
    required: false,
    enum: ['en', 'ru', 'kk'],
    description: 'Preferred locale for analysis and localized names',
  })
  @IsOptional()
  @IsIn(['en', 'ru', 'kk'])
  locale?: 'en' | 'ru' | 'kk';
}

export class AnalyzeTextDto {
  @ApiProperty({ example: 'Grilled chicken breast with rice and vegetables' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description!: string;

  @ApiProperty({
    required: false,
    enum: ['en', 'ru', 'kk'],
    description: 'Preferred locale for analysis and localized names',
  })
  @IsOptional()
  @IsIn(['en', 'ru', 'kk'])
  locale?: 'en' | 'ru' | 'kk';
}
