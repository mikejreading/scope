import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @ApiPropertyOptional({ description: 'Whether the user is active', default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean = true;

  @ApiProperty({ description: 'Date when the user was created', type: Date })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date when the user was last updated', type: Date })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
