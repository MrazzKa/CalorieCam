import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ example: 70.5, required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ example: 175, required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ example: 'MALE', required: false })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({ example: 'MODERATE', required: false })
  @IsOptional()
  @IsEnum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'])
  activityLevel?: string;

  @ApiProperty({ example: 'WEIGHT_LOSS', required: false })
  @IsOptional()
  @IsEnum(['WEIGHT_LOSS', 'WEIGHT_GAIN', 'MAINTENANCE'])
  goal?: string;
}
