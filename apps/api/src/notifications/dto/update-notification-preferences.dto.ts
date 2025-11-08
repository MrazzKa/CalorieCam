import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Whether daily push reminders are enabled', default: false })
  @IsOptional()
  @IsBoolean()
  dailyPushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Hour of day (0-23) to send reminders in local timezone', default: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  dailyPushHour?: number;

  @ApiPropertyOptional({ description: 'IANA timezone identifier', default: 'UTC', example: 'Europe/Berlin' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

