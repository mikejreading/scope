import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral, EntityTarget, FindOptionsWhere, FindManyOptions, FindOneOptions, DeepPartial, UpdateResult, DeleteResult } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { SuperTest, Test as TestAgent } from 'supertest';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Mock<T = any> extends Function, MockInstance<T> {
      new (...args: any[]): T;
      (...args: any[]): any;
    }
  }
}

/**
 * Creates a mock repository with type-safe methods
 * @param entity The entity type to mock
 * @returns A mock repository with all TypeORM methods
 */
export function createMockRepository<T extends ObjectLiteral>(
  entity: new () => T
): jest.Mocked<Repository<T>> {
  const mockMethods = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
    hasId: jest.fn(),
    getId: jest.fn(),
    merge: jest.fn(),
    preload: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    countBy: jest.fn(),
    exists: jest.fn(),
    existsBy: jest.fn(),
    findOneWithRelations: jest.fn(),
    findByIds: jest.fn(),
    findAndCountBy: jest.fn(),
    upsert: jest.fn(),
  };

  // Set up default implementations
  mockMethods.create.mockImplementation((entityLike: any) => ({
    ...new entity(),
    ...entityLike,
  }));

  mockMethods.save.mockImplementation((entity: any) => Promise.resolve(entity));
  mockMethods.find.mockResolvedValue([]);
  mockMethods.findOne.mockResolvedValue(undefined);
  mockMethods.findOneBy.mockResolvedValue(undefined);
  mockMethods.findAndCount.mockResolvedValue([[], 0]);
  mockMethods.count.mockResolvedValue(0);
  mockMethods.update.mockResolvedValue({ affected: 1 } as UpdateResult);
  mockMethods.delete.mockResolvedValue({ affected: 1 } as DeleteResult);
  mockMethods.remove.mockImplementation((entity: any) => Promise.resolve(entity));
  mockMethods.findOneOrFail.mockRejectedValue(new Error('Entity not found'));
  mockMethods.findOneByOrFail.mockRejectedValue(new Error('Entity not found'));
  mockMethods.exists.mockResolvedValue(false);
  mockMethods.existsBy.mockResolvedValue(false);

  return mockMethods as unknown as jest.Mocked<Repository<T>>;
}

/**
 * Creates a testing NestJS application with TypeORM configured for testing
 * @returns Promise<INestApplication>
 */
export const createTestingApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [User],
        synchronize: true,
        dropSchema: true,
      }),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};

/**
 * Get a TypeORM repository for testing
 * @param app Nest application instance
 * @param entity Entity class
 * @returns Repository instance
 */
export const getRepository = <T extends ObjectLiteral>(
  app: INestApplication,
  entity: EntityTarget<T>,
): Repository<T> => {
  return app.get<Repository<T>>(getRepositoryToken(entity));
};

/**
 * Create a test user
 * @param app Nest application instance
 * @param userData User data to override defaults
 * @returns Created user
 */
export const createTestUser = async (
  app: INestApplication, 
  userData: Partial<User> = {}
): Promise<User> => {
  const userRepository = getRepository(app, User);
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };
  
  const user = userRepository.create({ ...defaultUser, ...userData });
  return userRepository.save(user);
};

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Get authentication token for testing
 * @param app Nest application instance
 * @param email User email
 * @param password User password
 * @returns JWT access token
 */
export const getAuthToken = async (
  app: INestApplication,
  email: string,
  password: string
): Promise<string> => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  const { access_token } = response.body as LoginResponse;
  return access_token;
};
