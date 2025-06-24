import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/entities/user.entity';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMockRepository } from '../test-utils';

// Mock the bcrypt module
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
    userRepository = createMockRepository(User);
    
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
      
      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createUserDto,
        password: 'hashed' + createUserDto.password,
      }));
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
      const user = createTestUser();
      
      userRepository.findOne.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);

      await service.remove(userId);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
