import { jest } from '@jest/globals';
import { Repository, ObjectLiteral } from 'typeorm';

type BcryptMock = {
  hash: (password: string) => Promise<string>;
  compare: (password: string, hash: string) => Promise<boolean>;
};

// Create a typed mock for bcrypt
const createBcryptMock = (): BcryptMock => {
  const mock: BcryptMock = {
    hash: jest.fn((password: string) => 
      Promise.resolve('hashed' + password)
    ) as unknown as (password: string) => Promise<string>,
    compare: jest.fn((password: string, hash: string) => 
      Promise.resolve(hash === 'hashed' + password)
    ) as unknown as (password: string, hash: string) => Promise<boolean>
  };
  return mock;
};

// Export a default mock instance
export const mockBcrypt = createBcryptMock();

export { createBcryptMock };

export function createMockRepository<T extends ObjectLiteral>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    // Add other Repository methods as needed
  } as unknown as jest.Mocked<Repository<T>>;
}

// Mock the bcrypt module globally
jest.mock('bcrypt', () => ({
  ...(jest.requireActual('bcrypt') as object),
  ...mockBcrypt,
}));
