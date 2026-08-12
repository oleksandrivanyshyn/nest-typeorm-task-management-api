import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { TestSetup } from './utils/test-setup';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { PasswordService } from '../src/users/password/password.service';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from '../src/users/login.response';
import { AdminResponse } from '../src/users/admin.response';
import { AuthRequest } from '../src/users/auth.request';

describe('AppController (e2e)', () => {
  let testSetup: TestSetup;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };
  it('should require auth', async () => {
    return request(testSetup.app.getHttpServer()).get('/tasks').expect(401);
  });
  it('should allow public routes', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);
    await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201);
  });

  it('should includes roles in JWT token', async () => {
    const userRepo = testSetup.app.get<Repository<User>>(
      getRepositoryToken(User),
    );
    const passwordService = testSetup.app.get(PasswordService);

    const hashedPassword = await passwordService.hash(testUser.password);
    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: hashedPassword,
    });
    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body as LoginResponse;
    const decoded = testSetup.app
      .get(JwtService)
      .verify<AuthRequest['user']>(accessToken);

    expect(decoded.roles).toBeDefined();
    expect(decoded.roles).toContain(Role.ADMIN);
  });
  it('/auth/register (POST)', () => {
    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        const body = res.body as User;
        expect(body.email).toBe(testUser.email);
        expect(body.name).toBe(testUser.name);
        expect(body).not.toHaveProperty('password');
      });
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(201);
    expect((response.body as LoginResponse).accessToken).toBeDefined();
  });

  it('/auth/profile (GET)', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body as LoginResponse;

    return request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as User;
        expect(body.email).toBe(testUser.email);
        expect(body.name).toBe(testUser.name);
        expect(body).not.toHaveProperty('password');
      });
  });
  it('/auth/admin (GET) - admin access', async () => {
    const userRepo = testSetup.app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    const passwordService = testSetup.app.get(PasswordService);

    const hashedPassword = await passwordService.hash(testUser.password);
    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: hashedPassword,
    });
    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body as LoginResponse;
    await request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as AdminResponse).message).toBe(
          'This is for admins only!',
        );
      });
  });
  it('/auth/admin (GET) - regular user denied', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const response = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body as LoginResponse;

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
  it('/auth/register (POST) - attempting to register as an admin', async () => {
    const userAdmin = {
      ...testUser,
      roles: [Role.ADMIN],
    };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(userAdmin)
      .expect(201)
      .expect((res) => {
        expect((res.body as User).roles).toEqual([Role.USER]);
      });
  });
});
