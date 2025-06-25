import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlacklistedTokensTable1719270000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE blacklisted_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token VARCHAR(500) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        reason VARCHAR(100),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "userId" VARCHAR(100) NOT NULL,
        CONSTRAINT "UQ_blacklisted_tokens_token" UNIQUE (token)
      );
      
      CREATE INDEX "IDX_blacklisted_tokens_token" ON blacklisted_tokens(token);
      CREATE INDEX "IDX_blacklisted_tokens_userId" ON blacklisted_tokens("userId");
      CREATE INDEX "IDX_blacklisted_tokens_expiresAt" ON blacklisted_tokens("expiresAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_blacklisted_tokens_expiresAt";
      DROP INDEX IF EXISTS "IDX_blacklisted_tokens_userId";
      DROP INDEX IF EXISTS "IDX_blacklisted_tokens_token";
      DROP TABLE IF EXISTS blacklisted_tokens;
    `);
  }
}
