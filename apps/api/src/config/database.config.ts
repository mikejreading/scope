import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isDevelopment = configService.get<string>('NODE_ENV', 'development') === 'development';
  
  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'scope_platform'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: isDevelopment,
    logging: isDevelopment ? ['query', 'error'] : false,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  };

  // Add migrations configuration for CLI
  if (isDevelopment) {
    Object.assign(config, {
      migrationsRun: true,
    });
  }

  return config;
};
