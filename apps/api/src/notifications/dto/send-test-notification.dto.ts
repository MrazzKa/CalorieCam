import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SendTestNotificationDto {
  @ApiProperty({ example: 'EatSense', description: 'Push notification title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Test push notification body', description: 'Push notification body' })
  @IsString()
  body: string;

  @ApiProperty({
    required: false,
    description: 'Additional data payload to send with the notification',
    example: { screen: 'Dashboard' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

