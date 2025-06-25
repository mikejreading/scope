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
    // Use a valid bcrypt hash as default password
    password: overrides.password || '$2b$10$vJSF3BBEdQEN7KoUld2JU.uVTvdXt7REibqyZ3uJH5SX.6xti6OL6',
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
      
      // Check that the response contains the expected user data (ignoring date format)
      const responseUsers = response.body;
      expect(responseUsers).toHaveLength(users.length);
      responseUsers.forEach((user: any, index: number) => {
        const expectedUser = users[index];
        expect(user).toMatchObject({
          id: expectedUser.id,
          email: expectedUser.email,
          firstName: expectedUser.firstName,
          lastName: expectedUser.lastName,
          isActive: expectedUser.isActive
        });
        // Verify dates are valid ISO strings
        expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
        expect(new Date(user.updatedAt).toISOString()).toBe(user.updatedAt);
      });
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      userRepository.findOne.mockResolvedValue(testUser);

      const response = await request(app.getHttpServer())
        .get(`/users/${testUser.id}`) // Use testUser.id directly
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Check that the response contains the expected user data (ignoring date format)
      const responseUser = response.body;
      expect(responseUser).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        isActive: testUser.isActive
      });
      // Verify dates are valid ISO strings
      expect(new Date(responseUser.createdAt).toISOString()).toBe(responseUser.createdAt);
      expect(new Date(responseUser.updatedAt).toISOString()).toBe(responseUser.updatedAt);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return 404 if user not found', async () => {
      const userId = '999';
      userRepository.findOne.mockResolvedValue(null);

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
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockResolvedValue(expectedUser);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);
      
      const responseUser = response.body;
      
      // Check that the response contains the expected user data
      expect(responseUser).toMatchObject({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: true,
      });
      
      // Verify the response has valid timestamps
      expect(new Date(responseUser.createdAt).toISOString()).toBe(responseUser.createdAt);
      expect(new Date(responseUser.updatedAt).toISOString()).toBe(responseUser.updatedAt);
      
      // Verify create was called with the DTO (checking only the fields we care about)
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      }));
      
      // Verify password was hashed (starts with $2b$)
      const createCall = (userRepository.create as jest.Mock).mock.calls[0][0] as { password: string };
      expect(createCall.password).toMatch(/^\$2b\$\d+\$.{53}$/);
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
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateUserDto)
        .expect(200);
      
      // Check that the response contains the updated user data
      const responseUser = response.body;
      expect(responseUser).toMatchObject({
        id: testUser.id,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });
      
      // Verify preload was called with the update data
      expect(userRepository.preload).toHaveBeenCalledWith(expect.objectContaining({
        id: testUser.id,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      }));
      // Verify dates are valid ISO strings
      expect(new Date(responseUser.createdAt).toISOString()).toBe(responseUser.createdAt);
      expect(new Date(responseUser.updatedAt).toISOString()).toBe(responseUser.updatedAt);
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
