import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  image: any;
}

export class AnalyzeTextDto {
  @ApiProperty({ example: 'Grilled chicken breast with rice and vegetables' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description!: string;
}
