import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the API's .env file
config({ path: resolve(__dirname, '../apps/api/.env') });

// Import the data source configuration from the API project
const { dataSourceOptions } = require('../apps/api/ormconfig');

// Create a new DataSource instance
const AppDataSource = new DataSource({
  ...dataSourceOptions,
  // Override the entities and migrations paths to be relative to the monorepo root
  entities: [resolve(__dirname, '../apps/api/src/**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, '../apps/api/src/database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
});

// Export the DataSource for use with the TypeORM CLI
module.exports = {
  AppDataSource,
};

// If this file is run directly, run the migrations
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      console.log('Data Source has been initialized!');
      
      // Run migrations
      const migrations = await AppDataSource.runMigrations();
      console.log('Migrations run:', migrations);
      
      // Close the connection
      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during Data Source initialization', error);
      process.exit(1);
    });
}
