import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { bearer, PublicLogin, RequireAdmin } from './auth.guard';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  password: string;
}

@Controller('auth')
@RequireAdmin()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @PublicLogin()
  login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    // Do not trust arbitrary X-Forwarded-For values. Proxy peers share this limit.
    return this.auth.login(
      body.password,
      req.ip || req.socket.remoteAddress || 'unknown',
    );
  }

  @Get('session')
  session(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return { expiresAt: this.auth.verify(bearer(req)) };
  }

  @Post('logout')
  logout(@Req() req: Request) {
    this.auth.logout(bearer(req));
    return { success: true };
  }
}
