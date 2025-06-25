import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('blacklisted_tokens')
export class BlacklistedToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  @Index({ unique: true })
  token!: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reason?: string | null = null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', length: 100 })
  userId!: string;

  constructor(partial: Partial<BlacklistedToken>) {
    Object.assign(this, partial);
  }
}