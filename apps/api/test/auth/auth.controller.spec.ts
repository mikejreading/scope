import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';

import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { createMockRepository, mockBcrypt } from '../test-mocks';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Mock<T = any> extends Function, MockInstance<any, any> {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface MockInstance<T, Y extends any[]> {}
  }
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: JwtService;
  let authToken: string;
  
  // Test user data
  const testUserData = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };

  // Create a test user instance
  const createTestUser = (overrides: Partial<User> = {}) => ({
    ...testUserData,
    id: overrides.id || testUserData.id,
    email: overrides.email || testUserData.email,
    password: overrides.password || 'hashed' + testUserData.password,
    firstName: overrides.firstName || testUserData.firstName,
    lastName: overrides.lastName || testUserData.lastName,
    isActive: overrides.isActive !== undefined ? overrides.isActive : testUserData.isActive,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  });

  beforeAll(async () => {
    // Create a fresh mock repository for testing
    userRepository = createMockRepository<User>();
    
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(userRepository)
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn(() => 'test-token'),
        verify: jest.fn(() => ({ sub: '1' })),
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
    
    // Set up test data
    authToken = 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const expectedUser = createTestUser({
        ...registerData,
        password: 'hashed' + registerData.password,
      });

      // Mock the repository methods
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockResolvedValue(expectedUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBe('test-token');
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...registerData,
        password: 'hashed' + registerData.password,
      }));
      expect(userRepository.save).toHaveBeenCalledWith(expectedUser);
    });

    it('should return 400 if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      // Mock the repository to return an existing user
      userRepository.findOne.mockResolvedValue(createTestUser());

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock the repository to return a user
      userRepository.findOne.mockResolvedValue(
        createTestUser({ password: 'hashed' + loginData.password })
      );

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBe('test-token');
    });

    it('should return 401 with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock the repository to return a user with different password
      userRepository.findOne.mockResolvedValue(
        createTestUser({ password: 'hashedcorrectpassword' })
      );

      // Mock bcrypt.compare to return false for this test
      (mockBcrypt.compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(false));

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const testUser = createTestUser();
      // Mock the repository to return a user
      userRepository.findOne.mockResolvedValue(testUser);

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
