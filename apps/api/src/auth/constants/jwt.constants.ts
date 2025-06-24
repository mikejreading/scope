import { JwtModuleOptions } from '@nestjs/jwt';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const JWT_CONFIG: JwtModuleOptions = {
  secret: JWT_SECRET,
  signOptions: { expiresIn: JWT_EXPIRES_IN },
};
