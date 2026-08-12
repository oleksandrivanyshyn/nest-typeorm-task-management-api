import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../password/password.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findOneByEmail: jest.Mock; createUser: jest.Mock };

  const createUserDto = {
    email: 'race@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOneByEmail: jest.fn(),
            createUser: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should convert a unique-violation race into a ConflictException', async () => {
    userService.findOneByEmail.mockResolvedValue(null);
    const driverError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      { code: '23505' },
    );
    userService.createUser.mockRejectedValue(
      new QueryFailedError('INSERT INTO "user" ...', [], driverError),
    );

    await expect(service.register(createUserDto)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should rethrow createUser errors that are not a unique violation', async () => {
    userService.findOneByEmail.mockResolvedValue(null);
    const otherError = new Error('connection lost');
    userService.createUser.mockRejectedValue(otherError);

    await expect(service.register(createUserDto)).rejects.toThrow(otherError);
  });
});
