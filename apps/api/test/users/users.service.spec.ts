import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/entities/user.entity';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
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

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

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

  beforeEach(async () => {
    // Create a fresh mock repository for each test
    userRepository = createMockRepository<User>();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
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

      const result = await service.create(createUserDto);
      
      // Check that the result matches expected user data (excluding password)
      expect(result).toMatchObject({
        email: expectedUser.email,
        firstName: expectedUser.firstName,
        lastName: expectedUser.lastName,
      });
      
      // Verify create was called with the DTO
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

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };

      // Mock the repository to return an existing user
      userRepository.findOne.mockResolvedValue(createTestUser());

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [createTestUser()];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      const user = createTestUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(userId);
      
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '999';
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = createTestUser({ email });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);
      
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateData = { firstName: 'Updated' };
      const updatedUser = createTestUser({ ...updateData });

      userRepository.findOne.mockResolvedValue(createTestUser());
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);
      
      expect(result).toEqual(updatedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = '1';
      
      userRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(userId);
      
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '999';
      
      userRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
