import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { BaseUserDto } from './base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @ApiProperty({
    description: 'Password (min 8 characters, at least 1 letter and 1 number)',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[0-9])(?=.*[a-zA-Z]).*/, {
    message: 'Password must contain at least 1 letter and 1 number',
  })
  password: string;
}
