import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenService } from './token.service';
import { BlacklistedToken } from './entities/token.entity';

describe('TokenService', () => {
  let service: TokenService;
  let tokenRepository: Repository<BlacklistedToken>;

  const mockTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(BlacklistedToken),
          useValue: mockTokenRepository,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    tokenRepository = module.get<Repository<BlacklistedToken>>(
      getRepositoryToken(BlacklistedToken),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blacklistToken', () => {
    it('should blacklist a token', async () => {
      const token = 'test-token';
      const userId = 'user-id';
      const expiresAt = new Date();
      const reason = 'test-reason';
      
      const mockToken = {
        id: 'token-id',
        token,
        userId,
        expiresAt,
        reason,
      };

      mockTokenRepository.create.mockReturnValue(mockToken);
      mockTokenRepository.save.mockResolvedValue(mockToken);

      const result = await service.blacklistToken(token, userId, expiresAt, reason);

      expect(mockTokenRepository.create).toHaveBeenCalledWith({
        token,
        userId,
        expiresAt,
        reason,
      });
      expect(mockTokenRepository.save).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockToken);
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      const token = 'test-token';
      mockTokenRepository.count.mockResolvedValue(1);

      const result = await service.isTokenBlacklisted(token);

      expect(mockTokenRepository.count).toHaveBeenCalledWith({
        where: { token },
      });
      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      const token = 'test-token';
      mockTokenRepository.count.mockResolvedValue(0);

      const result = await service.isTokenBlacklisted(token);

      expect(mockTokenRepository.count).toHaveBeenCalledWith({
        where: { token },
      });
      expect(result).toBe(false);
    });
  });

  describe('removeExpiredTokens', () => {
    it('should remove expired tokens', async () => {
      const queryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };
      
      mockTokenRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.removeExpiredTokens();

      expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.from).toHaveBeenCalledWith(BlacklistedToken);
      expect(queryBuilder.where).toHaveBeenCalledWith('"expiresAt" < NOW()');
      expect(queryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('removeToken', () => {
    it('should remove a token', async () => {
      const token = 'test-token';
      
      await service.removeToken(token);

      expect(mockTokenRepository.delete).toHaveBeenCalledWith({ token });
    });
  });
});
