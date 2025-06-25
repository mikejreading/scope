import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedToken } from './entities/token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(BlacklistedToken)
    private readonly tokenRepository: Repository<BlacklistedToken>,
  ) {}

  /**
   * Clean up expired blacklisted tokens
   * Runs every day at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredTokensCleanup() {
    this.logger.log('Starting cleanup of expired blacklisted tokens...');
    
    try {
      const result = await this.tokenRepository
        .createQueryBuilder()
        .delete()
        .from(BlacklistedToken)
        .where('"expiresAt" < NOW()')
        .execute();
      
      this.logger.log(`Successfully cleaned up ${result.affected || 0} expired tokens`);
    } catch (error) {
      this.logger.error('Error cleaning up expired tokens', error.stack);
    }
  }
}
