import { Controller, Get, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(@Request() req: any) {
    return this.sessionsService.getSessions(req.user.id);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Revoke all sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked successfully' })
  async revokeAllSessions(@Request() req: any) {
    return this.sessionsService.revokeAllSessions(req.user.id);
  }
}
