import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { loginSchema, type User } from '@shared/schema';
import { z } from 'zod';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Simple password hashing for demo purposes
// In production, use bcrypt or similar
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user has specific role
export function hasRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // In a real app, use a proper password hashing library
    // For the demo, assume passwords are stored as plain text
    if (user.password !== password) { // In production, use verifyPassword(password, user.password)
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Store user ID in session
    req.session.userId = user.id;

    // Log the activity
    await storage.createActivity({
      userId: user.id,
      action: 'Login',
      details: `User ${user.username} logged in`,
    });

    // Return user data (exclude password)
    const { password: _, ...userData } = user;
    res.status(200).json(userData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', details: error.format() });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout handler
export async function logout(req: Request, res: Response) {
  try {
    if (req.session.userId) {
      // Log the activity
      await storage.createActivity({
        userId: req.session.userId,
        action: 'Logout',
        details: 'User logged out',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get current user handler
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data (exclude password)
    const { password: _, ...userData } = user;
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
