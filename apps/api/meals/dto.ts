import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMealDto {
  @ApiProperty({ example: 'Breakfast' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'BREAKFAST' })
  @IsString()
  type!: string;

  @ApiProperty({ example: '2024-01-01T08:00:00Z' })
  @IsString()
  @IsOptional()
  consumedAt?: string;

  @ApiProperty({ 
    example: [
      {
        name: 'Scrambled Eggs',
        calories: 200,
        protein: 12,
        fat: 15,
        carbs: 2,
        weight: 100
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items!: any[];
}
