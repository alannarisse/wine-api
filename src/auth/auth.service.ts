import {
  Injectable,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const TTL = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, number>();
  private readonly attempts = new Map<
    string,
    { count: number; until: number }
  >();
  private readonly salt: Buffer;
  private readonly hash: Buffer;

  constructor(config: ConfigService) {
    const encoded = config.get<string>('ADMIN_PASSWORD_HASH') || '';
    if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)) {
      throw new Error(
        'Set ADMIN_PASSWORD_HASH using npm run auth:hash before starting the API.',
      );
    }
    const [salt, hash] = encoded.split(':');
    this.salt = Buffer.from(salt, 'hex');
    this.hash = Buffer.from(hash, 'hex');
  }

  async login(password: string, address: string) {
    const now = Date.now();
    for (const [key, value] of this.attempts)
      if (value.until <= now) this.attempts.delete(key);
    const attempt = this.attempts.get(address) || {
      count: 0,
      until: now + 15 * 60 * 1000,
    };
    // Include in-flight attempts so concurrent requests cannot bypass the limit.
    if (
      attempt.count >= 5 ||
      (!this.attempts.has(address) && this.attempts.size >= 10000)
    ) {
      throw new HttpException(
        'Too many login attempts. Try again in 15 minutes.',
        429,
      );
    }
    attempt.count++;
    this.attempts.set(address, attempt);
    const candidate = (await derive(password, this.salt, 64)) as Buffer;
    if (!timingSafeEqual(candidate, this.hash))
      throw new UnauthorizedException('Invalid password');
    this.attempts.delete(address);
    for (const [key, expiry] of this.sessions)
      if (expiry <= now) this.sessions.delete(key);
    if (this.sessions.size >= 1000)
      throw new HttpException('Too many active sessions', 429);
    const token = randomBytes(32).toString('hex');
    const expiresAt = now + TTL;
    this.sessions.set(this.key(token), expiresAt);
    return { token, expiresAt };
  }

  private key(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  verify(token: string): number {
    const expiry = /^[a-f0-9]{64}$/.test(token)
      ? this.sessions.get(this.key(token))
      : undefined;
    if (!expiry || expiry <= Date.now()) {
      if (token) this.sessions.delete(this.key(token));
      throw new UnauthorizedException(
        'Admin session expired. Please log in again.',
      );
    }
    return expiry;
  }

  logout(token: string): void {
    this.sessions.delete(this.key(token));
  }
}
