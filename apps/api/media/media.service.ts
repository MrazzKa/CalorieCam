import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(file: any, userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Process image with Sharp
    const processedImage = await sharp(file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Create media record
    const media = await this.prisma.media.create({
      data: {
        userId,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: processedImage.length,
        data: Buffer.from(processedImage),
      },
    });

    return {
      id: media.id,
      filename: media.filename,
      mimetype: media.mimetype,
      size: media.size,
      url: `/media/${media.id}`,
    };
  }
}
