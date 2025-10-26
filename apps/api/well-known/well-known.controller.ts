import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Well-Known')
@Controller('.well-known')
export class WellKnownController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('security.txt')
  @ApiOperation({ summary: 'Security information' })
  @ApiResponse({ status: 200, description: 'Security information retrieved' })
  getSecurity() {
    return {
      contact: 'security@caloriecam.app',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      encryption: 'https://caloriecam.app/pgp-key.txt',
      acknowledgments: 'https://caloriecam.app/security',
    };
  }
}
