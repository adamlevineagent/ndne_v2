import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Warn if using default JWT secret in non-test environment
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!');
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  static generateToken(user: User): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d' // Token expires in 7 days
    });
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }

  /**
   * Register a new user
   */
  static async register(email: string, password: string): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login a user
   */
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const userData = result.rows[0];

    // Verify password
    const isValidPassword = await this.verifyPassword(password, userData.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Return user without password hash
    const user: User = {
      id: userData.id,
      email: userData.email,
      created_at: userData.created_at
    };

    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}