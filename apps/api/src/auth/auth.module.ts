import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JWT_CONFIG } from './constants/jwt.constants';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register(JWT_CONFIG),
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
