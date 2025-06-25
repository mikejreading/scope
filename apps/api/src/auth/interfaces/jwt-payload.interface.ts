export interface JwtPayload {
  sub: string; // user ID
  email: string;
  jti?: string; // JWT ID - unique identifier for the token
  isRefreshToken?: boolean; // flag to identify refresh tokens
  iat?: number; // issued at
  exp?: number; // expiration time
}
