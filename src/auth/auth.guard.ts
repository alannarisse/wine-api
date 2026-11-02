import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import type { Request } from 'express';

export const PublicLogin = () => SetMetadata('publicLogin', true);
export const RequireAdmin = () => SetMetadata('requireAdmin', true);
export function bearer(request: Request): string {
  return (
    /^Bearer ([a-f0-9]{64})$/.exec(request.headers.authorization || '')?.[1] ||
    ''
  );
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.get<boolean>('publicLogin', context.getHandler()))
      return true;
    const request = context.switchToHttp().getRequest<Request>();
    const required = this.reflector.getAllAndOverride<boolean>('requireAdmin', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required && ['GET', 'HEAD', 'OPTIONS'].includes(request.method))
      return true;
    this.auth.verify(bearer(request));
    return true;
  }
}
