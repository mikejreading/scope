import { MigrationInterface, QueryRunner, Table, TableColumnOptions } from 'typeorm';

export class InitialSchema1719256328000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          } as TableColumnOptions,
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          } as TableColumnOptions,
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          } as TableColumnOptions,
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          } as TableColumnOptions,
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
            select: false,
          } as TableColumnOptions,
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          } as TableColumnOptions,
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          } as TableColumnOptions,
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          } as TableColumnOptions,
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
