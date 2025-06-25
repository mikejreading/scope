import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenService } from './token/token.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Request } from 'express';
import { JWT_CONFIG, JWT_EXPIRES_IN } from './constants/jwt.constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { 
      sub: user.id, 
      email: user.email,
      jti: this.generateJti(),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = this.jwtService.sign(
      { ...payload, isRefreshToken: true },
      { expiresIn: JWT_CONFIG.refreshExpiresIn }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: JWT_EXPIRES_IN,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(token: string, userId: string): Promise<void> {
    const decoded = this.jwtService.decode(token) as JwtPayload | null;
    if (!decoded?.exp) {
      return;
    }

    const expiresAt = new Date(decoded.exp * 1000);
    await this.tokenService.blacklistToken(token, userId, expiresAt, 'user_logout');
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        ignoreExpiration: false,
      });

      if (payload.isRefreshToken !== true) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Blacklist the used refresh token
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date();
      await this.tokenService.blacklistToken(
        refreshToken,
        payload.sub,
        expiresAt,
        'token_refresh'
      );

      // Generate new tokens
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        jti: this.generateJti(),
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, isRefreshToken: true },
        { expiresIn: JWT_CONFIG.refreshExpiresIn }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: JWT_EXPIRES_IN,
        token_type: 'bearer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateJti(): string {
    // Generate a random string for JWT ID
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  async register(createUserDto: any) {
    // This will be implemented after we create the RegisterDto
    const user = await this.usersService.create(createUserDto);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
