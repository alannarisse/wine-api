import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { scryptSync } from 'node:crypto';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { AuthModule } from '../src/auth/auth.module';
import { WinesController } from '../src/wines/wines.controller';
import { WinesService } from '../src/wines/wines.service';
import { VarietalMappingsController } from '../src/varietal-mappings/varietal-mappings.controller';
import { VarietalMappingsService } from '../src/varietal-mappings/varietal-mappings.service';

const password = 'fixture-only-password-123';
const salt = Buffer.alloc(16, 1);
const hash = `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
const writes = [
  ['post', '/api/wines'],
  ['patch', '/api/wines/1'],
  ['delete', '/api/wines/1'],
  ['post', '/api/varietal-mappings'],
  ['delete', '/api/varietal-mappings/Pinot%20Noir/1'],
] as const;

describe('Server admin authentication (no database)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(() => ({ id: 1 })),
    update: jest.fn(() => ({ id: 1 })),
    remove: jest.fn(),
    findAll: jest.fn(() => []),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [() => ({ ADMIN_PASSWORD_HASH: hash })],
        }),
        AuthModule,
      ],
      controllers: [WinesController, VarietalMappingsController],
      providers: [
        { provide: WinesService, useValue: service },
        { provide: VarietalMappingsService, useValue: service },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => hash })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });
  const login = async (app: INestApplication) =>
    (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password })
        .expect(201)
    ).body.token as string;

  it('keeps reads public but rejects every write without a valid session', async () => {
    await request(app.getHttpServer()).get('/api/wines').expect(200);
    await request(app.getHttpServer())
      .get('/api/varietal-mappings')
      .expect(200);
    for (const [method, path] of writes) {
      await request(app.getHttpServer())[method](path).send({}).expect(401);
      await request(app.getHttpServer())
        [method](path)
        .set('Authorization', `Bearer ${'a'.repeat(64)}`)
        .send({})
        .expect(401);
    }
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.remove).not.toHaveBeenCalled();
    await request(app.getHttpServer()).get('/api/auth/session').expect(401);
  });

  it('checks the password and revokes a session on logout', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password: 'wrong' })
      .expect(401);
    const token = await login(app);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/wines/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(service.remove).toHaveBeenCalledWith(1);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    await request(app.getHttpServer())
      .delete('/api/wines/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('expires sessions after eight hours', async () => {
    const token = await login(app);
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 8 * 60 * 60 * 1000 + 1);
    await request(app.getHttpServer())
      .patch('/api/wines/1')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(401);
  });

  it('limits repeated login guesses', async () => {
    for (let i = 0; i < 5; i++)
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'wrong' })
        .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password })
      .expect(429);
  });

  it('allows authenticated create/update operations through validation', async () => {
    const token = await login(app);
    const wine = {
      wineryName: 'Test',
      wineName: 'Test',
      varietal: 'Fiano',
      estimatedPrice: 10,
      wineryCity: 'Test',
      wineryState: 'Test',
      wineryAddress: 'Test',
      wineryUrl: 'https://example.com',
      imageUrl: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/image.jpg',
    };
    await request(app.getHttpServer())
      .post('/api/wines')
      .set('Authorization', `Bearer ${token}`)
      .send(wine)
      .expect(201);
    await request(app.getHttpServer())
      .patch('/api/wines/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ estimatedPrice: 11 })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/varietal-mappings')
      .set('Authorization', `Bearer ${token}`)
      .send({ varietal: 'Fiano', wineId: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .delete('/api/varietal-mappings/Fiano/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
  it('refuses missing or malformed password configuration', () => {
    for (const value of ['', 'plaintext-is-not-a-hash']) {
      const config = { get: () => value } as unknown as ConfigService;
      expect(() => new AuthService(config)).toThrow('Set ADMIN_PASSWORD_HASH');
    }
  });

});
