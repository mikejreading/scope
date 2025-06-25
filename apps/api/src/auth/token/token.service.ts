import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedToken } from './entities/token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(BlacklistedToken)
    private readonly tokenRepository: Repository<BlacklistedToken>,
  ) {}

  async blacklistToken(
    token: string,
    userId: string,
    expiresAt: Date,
    reason?: string,
  ): Promise<BlacklistedToken> {
    const blacklistedToken = this.tokenRepository.create({
      token,
      userId,
      expiresAt,
      reason,
    });

    return this.tokenRepository.save(blacklistedToken);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const count = await this.tokenRepository.count({
      where: { token },
    });
    return count > 0;
  }

  async removeExpiredTokens(): Promise<void> {
    await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .from(BlacklistedToken)
      .where('"expiresAt" < NOW()')
      .execute();
  }

  async removeToken(token: string): Promise<void> {
    await this.tokenRepository.delete({ token });
  }
}
