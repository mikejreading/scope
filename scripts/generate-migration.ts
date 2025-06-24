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

// Generate migration
async function generateMigration() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    // Generate migration
    const migration = await dataSource.driver.createSchemaBuilder().log();
    console.log('Migration generated:', migration);
    
    // Generate migration file
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
    const migrationName = `InitialSchema${new Date().getTime()}`;
    const migrationPath = `./apps/api/src/database/migrations/${migrationName}.ts`;
    
    // Create migrations directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.dirname(migrationPath);
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Write migration file
    fs.writeFileSync(
      migrationPath,
      `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add your migration SQL here
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add your rollback SQL here
    }
}
`
    );
    
    console.log(`Migration file created at: ${migrationPath}`);
    
  } catch (error) {
    console.error('Error during migration generation:', error);
  } finally {
    await dataSource.destroy();
  }
}

generateMigration().catch(console.error);
