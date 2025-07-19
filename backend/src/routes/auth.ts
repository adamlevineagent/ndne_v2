import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * User registration endpoint
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const { user, token } = await AuthService.register(email.toLowerCase().trim(), password);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      },
      token
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists with this email') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

/**
 * User login endpoint
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const { user, token } = await AuthService.login(email.toLowerCase().trim(), password);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      },
      token
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await AuthService.getUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile' 
    });
  }
});

/**
 * Token validation endpoint
 * POST /api/auth/validate
 */
router.post('/validate', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  // If we reach here, the token is valid (middleware passed)
  res.json({
    valid: true,
    user: req.user
  });
});

export default router;