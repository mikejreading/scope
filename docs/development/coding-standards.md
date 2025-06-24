# Coding Standards - School Management Platform

## Table of Contents
1. [General Guidelines](#1-general-guidelines)
2. [TypeScript/JavaScript](#2-typescriptjavascript)
3. [NestJS/Backend](#3-nestjsbackend)
4. [React/Frontend](#4-reactfrontend)
5. [Database](#5-database)
6. [Testing](#6-testing)
7. [Git Workflow](#7-git-workflow)
8. [Documentation](#8-documentation)
9. [Security](#9-security)
10. [Performance](#10-performance)

## 1. General Guidelines

### 1.1. Code Style

- Use **2 spaces** for indentation (no tabs)
- Use **single quotes** for strings
- Use **semicolons** at the end of statements
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces
- Use **UPPER_SNAKE_CASE** for constants
- Use meaningful and descriptive names
- Keep lines under **100 characters**
- Add a single empty line at the end of files
- Remove trailing whitespace

### 1.2. File Naming

- Use **kebab-case** for file names
- Use **.ts** for TypeScript files
- Use **.tsx** for React components
- Use **.spec.ts** for test files
- Use **.e2e-spec.ts** for end-to-end tests

## 2. TypeScript/JavaScript

### 2.1. TypeScript Features

- Enable **strict** mode in `tsconfig.json`
- Use **interfaces** for defining object shapes
- Use **types** for unions, intersections, and mapped types
- Use **enums** for fixed sets of constants
- Use **readonly** for immutable properties
- Use **const assertions** (`as const`) for literal types

### 2.2. Variables and Types

```typescript
// Good
const userName = 'John';
let count = 0;
const MAX_RETRIES = 3;

// Bad
const user_name = 'John';
let Count = 0;
const maxRetries = 3;
```

### 2.3. Functions

- Use **arrow functions** for callbacks
- Use **default parameters** instead of `||` or `&&`
- Use **destructuring** for function parameters
- Use **rest parameters** for variable arguments

```typescript
// Good
function greet(name: string, age?: number): string {
  return `Hello, ${name}!`;
}

// With default parameter
function createUser(name: string, role = 'user') {
  // ...
}

// With destructuring
function processUser({ id, name, email }: User) {
  // ...
}
```

## 3. NestJS/Backend

### 3.1. Project Structure

```
src/
  app.controller.spec.ts
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  
  auth/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    dto/
      login.dto.ts
      register.dto.ts
    interfaces/
      jwt-payload.interface.ts
    strategies/
      jwt.strategy.ts
    
  users/
    users.controller.ts
    users.module.ts
    users.service.ts
    entities/
      user.entity.ts
    dto/
      create-user.dto.ts
      update-user.dto.ts
      user-response.dto.ts
    interfaces/
      user.interface.ts
    
  common/
    decorators/
      roles.decorator.ts
    filters/
      http-exception.filter.ts
    guards/
      roles.guard.ts
    interceptors/
      transform.interceptor.ts
    interfaces/
      pagination-params.interface.ts
    pipes/
      parse-int.pipe.ts
    
  config/
    database.config.ts
    app.config.ts
    
  database/
    migrations/
      1234567890-initial-migration.ts
    seeds/
      initial-seed.ts
```

### 3.2. Controllers

- Keep controllers thin
- Use **DTOs** for request/response validation
- Use **class-validator** for input validation
- Use **class-transformer** for response transformation
- Document endpoints with **Swagger decorators**

```typescript
@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.usersService.findAll(paginationQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### 3.3. Services

- Follow **single responsibility principle**
- Use **dependency injection**
- Handle business logic only
- Throw appropriate exceptions
- Use **async/await** for asynchronous operations

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto): Promise<User[]> {
    const { limit, offset } = paginationQuery;
    return this.userRepository.find({
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    
    return this.userRepository.save(user);
  }
}
```

## 4. React/Frontend

### 4.1. Project Structure

```
src/
  components/
    common/
      Button/
        Button.tsx
        Button.stories.tsx
        Button.test.tsx
        Button.module.css
    layout/
      Header.tsx
      Sidebar.tsx
    pages/
      HomePage.tsx
      LoginPage.tsx
      UsersPage.tsx
  
  hooks/
    useAuth.ts
    useForm.ts
    useApi.ts
  
  services/
    api.ts
    auth.service.ts
    users.service.ts
  
  store/
    index.ts
    slices/
      auth.slice.ts
      users.slice.ts
    
  types/
    index.ts
    user.types.ts
    
  utils/
    formatters.ts
    validators.ts
    
  App.tsx
  index.tsx
  react-app-env.d.ts
```

### 4.2. Functional Components

- Use **functional components** with hooks
- Use **TypeScript** for type safety
- Use **destructuring** for props
- Use **default exports** for components
- Keep components small and focused

```typescript
import React, { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import { Button } from '../common/Button';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  user: User;
  onSave: (user: User) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className={styles.container}>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <Button type="submit">Save</Button>
          <Button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <h2>{user.name}</h2>
          <p>Email: {user.email}</p>
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
          <Button variant="danger" onClick={() => onDelete(user.id)}>
            Delete
          </Button>
        </>
      )}
    </div>
  );
};
```

## 5. Database

### 5.1. TypeORM Entities

- Use **decorators** for entity definitions
- Define **relations** explicitly
- Use **indexes** for frequently queried columns
- Use **enums** for fixed sets of values
- Add **timestamps** to all entities

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from '../enums/role.enum';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 5.2. Migrations

- Use **TypeORM migrations** for schema changes
- Name migrations with a timestamp prefix
- Write **up** and **down** methods
- Test migrations in development before applying to production

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleEnum1612345678901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('admin', 'teacher', 'student', 'parent')
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "role" "user_role_enum" NOT NULL DEFAULT 'student'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "role"
    `);
    
    await queryRunner.query(`
      DROP TYPE "user_role_enum"
    `);
  }
}
```

## 6. Testing

### 6.1. Unit Tests

- Use **Jest** as the test runner
- Write tests for all business logic
- Mock external dependencies
- Follow **AAA** pattern (Arrange, Act, Assert)
- Use **describe** and **it** blocks

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const testUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      };
      
      userRepository.find.mockResolvedValue([testUser]);
      
      const result = await service.findAll({ limit: 10, offset: 0 });
      
      expect(result).toEqual([testUser]);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });
});
```

### 6.2. E2E Tests

- Test critical user flows
- Use a separate test database
- Clean up test data after tests
- Mock external services

```typescript
describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    
    await app.init();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return an array of users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
        });
    });
  });
});
```

## 7. Git Workflow

### 7.1. Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### 7.2. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples**:
```
feat(users): add password reset functionality

- Add forgot password endpoint
- Send password reset email
- Add reset password form

Closes #123
```

```
fix(auth): prevent login with invalid credentials

- Validate credentials before issuing JWT
- Return 401 for invalid credentials
- Add tests for auth flow

Fixes #456
```

## 8. Documentation

### 8.1. Code Comments

- Use **JSDoc** for functions and classes
- Document complex algorithms
- Explain "why" not just "what"
- Keep comments up to date

```typescript
/**
 * Calculates the final grade based on scores and weights
 * @param scores - Array of assignment scores (0-100)
 * @param weights - Array of weights for each assignment (0-1)
 * @returns Final grade as a percentage (0-100)
 * @throws {Error} If scores and weights arrays have different lengths
 */
function calculateGrade(scores: number[], weights: number[]): number {
  if (scores.length !== weights.length) {
    throw new Error('Scores and weights must have the same length');
  }
  
  return scores.reduce((sum, score, i) => sum + score * weights[i], 0);
}
```

### 8.2. API Documentation

- Document all API endpoints with **Swagger/OpenAPI**
- Include request/response examples
- Document error responses
- Keep documentation up to date

```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'The user has been successfully created.',
    type: UserResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    // ...
  }
}
```

## 9. Security

### 9.1. Authentication & Authorization

- Use **JWT** for stateless authentication
- Implement **refresh tokens**
- Use **secure, HTTP-only cookies** for token storage
- Implement **rate limiting**
- Use **CSRF protection**

### 9.2. Input Validation

- Validate all user input
- Use **class-validator** for DTOs
- Sanitize user input
- Use parameterized queries

### 9.3. Dependencies

- Keep dependencies up to date
- Use **npm audit** to check for vulnerabilities
- Use **snyk** for dependency scanning
- Pin dependency versions in `package-lock.json`

## 10. Performance

### 10.1. Database

- Use **indexes** for frequently queried columns
- Implement **pagination** for large datasets
- Use **caching** for frequently accessed data
- Optimize queries with **EXPLAIN ANALYZE**

### 10.2. API

- Implement **caching** for static content
- Use **compression** for responses
- Implement **rate limiting**
- Use **pagination** for collections

### 10.3. Frontend

- Implement **code splitting**
- Use **lazy loading** for routes and components
- Optimize **bundle size**
- Implement **caching** for API responses

---

This document is a living document and should be updated as the project evolves.
