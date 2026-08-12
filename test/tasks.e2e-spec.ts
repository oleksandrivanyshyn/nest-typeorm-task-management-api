import { TestSetup } from './utils/test-setup';
import { AppModule } from '../src/app.module';
import { TaskStatus } from '../src/tasks/task.model';
import { Task } from '../src/tasks/task.entity';
import { PaginationResponse } from '../src/common/pagination.response';
import { LoginResponse } from '../src/users/login.response';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let testSetup: TestSetup;
  let authToken: string;
  let taskId: string;
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201);

    authToken = (loginResponse.body as LoginResponse).accessToken;

    const response = await request(testSetup.app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'Test Desc',
        status: TaskStatus.OPEN,
        labels: [{ name: 'test' }],
      });
    taskId = (response.body as Task).id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });
  it('should not allow access to other users tasks', async () => {
    const otherUser = { ...testUser, email: 'other@example.com' };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(201);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    const otherToken = (loginResponse.body as LoginResponse).accessToken;
    await request(testSetup.app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
  it('should list users tasks only', async () => {
    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as PaginationResponse<Task>).meta.total).toBe(1);
      });

    const otherUser = { ...testUser, email: 'other@example.com' };
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(201);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    const otherToken = (loginResponse.body as LoginResponse).accessToken;
    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as PaginationResponse<Task>).meta.total).toBe(0);
      });
  });

  it('POST /tasks/:id/labels - attaches a valid label', async () => {
    await request(testSetup.app.getHttpServer())
      .post(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ labels: [{ name: 'urgent' }] })
      .expect(201)
      .expect((res) => {
        const body = res.body as Task;
        expect(body.labels.map((label) => label.name)).toContain('urgent');
      });
  });

  it('POST /tasks/:id/labels - rejects a non-string label name', async () => {
    await request(testSetup.app.getHttpServer())
      .post(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ labels: [{ name: 12345 }] })
      .expect(400);
  });

  it('POST /tasks/:id/labels - rejects labels that are not an array', async () => {
    await request(testSetup.app.getHttpServer())
      .post(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ labels: { name: 'x' } })
      .expect(400);
  });

  it('POST /tasks/:id/labels - rejects a body without labels', async () => {
    await request(testSetup.app.getHttpServer())
      .post(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  it('DELETE /tasks/:id/labels - removes labels by name', async () => {
    await request(testSetup.app.getHttpServer())
      .delete(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ labelNames: ['test'] })
      .expect(204);
  });

  it('DELETE /tasks/:id/labels - rejects non-string entries', async () => {
    await request(testSetup.app.getHttpServer())
      .delete(`/tasks/${taskId}/labels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ labelNames: [{ name: 'test' }] })
      .expect(400);
  });

  it('POST /tasks - rejects a title over 100 characters', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'a'.repeat(101),
        description: 'Test Desc',
        status: TaskStatus.OPEN,
      })
      .expect(400)
      .expect((res) => {
        const body = res.body as { message: string[] };
        expect(body.message).toContain(
          'title must be shorter than or equal to 100 characters',
        );
      });
  });
});
