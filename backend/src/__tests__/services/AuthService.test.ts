import { AuthService } from '../../services/AuthService';
import prisma from '../../prisma';
import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        name,
        password: 'hashed-password',
        profile: {
          id: 'profile-1',
        },
      });

      const result = await authService.register({ email, password, name });

      expect(result.user.email).toBe(email);
      expect(result.user.name).toBe(name);
      expect(result.token).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should throw error if email already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      });

      await expect(authService.register({ email, password, name: 'Test' })).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        password: 'hashed-password',
        profile: {
          id: 'profile-1',
        },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
    });

    it('should throw error with incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrong-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
        password: 'hashed-password',
        profile: {
          id: 'profile-1',
        },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ email, password })).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      const email = 'notfound@example.com';
      const password = 'password123';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login({ email, password })).rejects.toThrow();
    });
  });
});

