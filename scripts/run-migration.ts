import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../apps/api/.env') });

// Create a new DataSource instance
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'scope_platform',
  entities: [__dirname + '/../apps/api/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../apps/api/src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});

// Run migrations
async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    // Run migrations
    const migrations = await dataSource.runMigrations();
    console.log('Migrations run:', migrations);
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigrations().catch(console.error);
