import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { jest } from '@jest/globals';

// Mock for TypeORM repository
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
});

// Create testing module with TypeORM
export const createTestingApp = async (entities: any[] = []): Promise<INestApplication> => {
  const moduleFixture = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [...entities],
        synchronize: true,
        dropSchema: true,
      }),
      TypeOrmModule.forFeature([...entities]),
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};

export const getRepository = <T extends ObjectLiteral>(
  app: INestApplication,
  entity: new () => T,
): Repository<T> => {
  return app.get<Repository<T>>(getRepositoryToken(entity));
};

// Jest setup
// Mocks are cleared automatically by Jest's configuration
