import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

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

  @Get('apple-app-site-association')
  @ApiOperation({ summary: 'iOS Universal Links configuration' })
  getAppleAppSiteAssociation(@Res() res: Response) {
    const association = {
      applinks: {
        apps: [],
        details: [
          {
            appID: 'TEAM_ID.com.caloriecam.app',
            paths: ['/v1/auth/magic/consume*'],
          },
        ],
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(association);
  }

  @Get('assetlinks.json')
  @ApiOperation({ summary: 'Android App Links configuration' })
  getAssetLinks(@Res() res: Response) {
    const assetLinks = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.caloriecam.app',
          sha256_cert_fingerprints: [
            // Add your SHA-256 certificate fingerprints here
            // 'AA:BB:CC:...',
          ],
        },
      },
    ];

    res.setHeader('Content-Type', 'application/json');
    res.json(assetLinks);
  }
}
