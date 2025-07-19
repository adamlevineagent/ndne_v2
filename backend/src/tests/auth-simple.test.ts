import { AuthService } from '../services/auth';

describe('AuthService - Core Functions', () => {
  describe('Password hashing and verification', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should verify a correct password', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT token generation and verification', () => {
    it('should generate and verify a valid token', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date()
      };

      const token = AuthService.generateToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = AuthService.verifyToken(token);
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });
  });
});