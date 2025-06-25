import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JWT_SECRET } from '../constants/jwt.constants';
import { UsersService } from '../../users/users.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          return token;
        },
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    // Check if token is blacklisted
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (token && await this.tokenService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify user exists
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Remove sensitive data before returning
    const { password, ...result } = user;
    return result;
  }
}
