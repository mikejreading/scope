import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: string;
  email: string;
  jti?: string;
  isRefreshToken?: boolean;
  iat?: number;
  exp?: number;
}

export const JWT_CONFIG: JwtModuleOptions & { refreshExpiresIn: string } = {
  secret: JWT_SECRET,
  signOptions: { expiresIn: JWT_EXPIRES_IN },
  refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
};

export const ACCESS_TOKEN_OPTIONS: JwtSignOptions = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
};

export const REFRESH_TOKEN_OPTIONS: JwtSignOptions = {
  secret: JWT_SECRET,
  expiresIn: JWT_REFRESH_EXPIRES_IN,
};
