import { Body, Controller, Post } from '@nestjs/common';

@Controller('debug')
export class DebugController {
  @Post('client-log')
  logClient(@Body() body: any) {
    console.log(
      '[CLIENT_LOG]',
      JSON.stringify({
        ...body,
        ts: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }
}
