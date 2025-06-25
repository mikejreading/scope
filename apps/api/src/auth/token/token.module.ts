import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BlacklistedToken } from './entities/token.entity';
import { TokenService } from './token.service';
import { TokenCleanupService } from './token-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlacklistedToken]),
    ScheduleModule.forRoot(),
  ],
  providers: [TokenService, TokenCleanupService],
  exports: [TokenService, TypeOrmModule],
})
export class TokenModule {}
