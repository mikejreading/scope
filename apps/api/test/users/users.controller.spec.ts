import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';

import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/entities/user.entity';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { createMockRepository } from '../test-utils';

// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn().mockImplementation((password) => 
    Promise.resolve('hashed' + password)
  ),
  compare: jest.fn().mockImplementation((password, hash) => 
    Promise.resolve('hashed' + password === hash)
  ),
} as unknown as {
  hash: jest.Mock<Promise<string>, [string]>;
  compare: jest.Mock<Promise<boolean>, [string, string]>;
};

// Mock the bcrypt module
jest.mock('bcrypt', () => mockBcrypt);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: jest.Mocked<Repository<User>>;
  let authToken: string;
  let testUser: User;
  
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
    userRepository = createMockRepository(User);
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
            verify: jest.fn(() => ({ sub: '1' })),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Set up test data
    testUser = createTestUser();
    authToken = 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return an array of users', async () => {
      const users = [testUser];
      userRepository.find.mockResolvedValue(users);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toEqual(users);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      userRepository.findOne.mockResolvedValue(testUser);

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toEqual(testUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return 404 if user not found', async () => {
      const userId = '999';
      userRepository.findOne.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const expectedUser = createTestUser({
        ...createUserDto,
        password: 'hashed' + createUserDto.password,
      });

      // Mock the repository methods
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockResolvedValue(expectedUser);

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createUserDto)
        .expect(201);
      
      expect(response.body).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createUserDto,
        password: 'hashed' + createUserDto.password,
      }));
      expect(userRepository.save).toHaveBeenCalledWith(expectedUser);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...testUser, ...updateUserDto };

      userRepository.findOne.mockResolvedValue(testUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateUserDto)
        .expect(200);
      
      expect(response.body).toEqual(updatedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should remove a user', async () => {
      const userId = '1';
      userRepository.findOne.mockResolvedValue(testUser);
      userRepository.remove.mockResolvedValue(testUser);

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.remove).toHaveBeenCalledWith(testUser);
    });
  });
});
