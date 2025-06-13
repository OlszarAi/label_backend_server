import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/database.service';
import { config } from '../config/config';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validation/auth.validation';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    const { email, username, password, firstName, lastName } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw createError('Email already registered', 409);
      }
      if (existingUser.username === username) {
        throw createError('Username already taken', 409);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    const { login: loginField, password } = value;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginField },
          { username: loginField }
        ],
        isActive: true
      }
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Check if user already has an active session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date() // Greater than current time (not expired)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let token: string;
    let session: any;

    if (existingSession) {
      // Use existing valid token
      token = existingSession.token;
      session = existingSession;
    } else {
      // Clean up any expired sessions for this user
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          expiresAt: {
            lte: new Date() // Less than or equal to current time (expired)
          }
        }
      });

      // Generate new JWT token
      token = jwt.sign(
        { userId: user.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (24 * 60 * 60 * 1000)); // 24 hours

      // Create new session
      session = await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        }
      });
    }

    // Return user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
        expiresAt: session.expiresAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Remove current session from database
      await prisma.session.deleteMany({
        where: {
          token,
          userId: req.user!.id
        }
      });

      // Optionally, remove all sessions for this user (logout from all devices)
      // await prisma.session.deleteMany({
      //   where: {
      //     userId: req.user!.id
      //   }
      // });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    
    // Find current session
    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: req.user!.id,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        }
      }
    });

    if (!session) {
      throw createError('Session not found or expired', 401);
    }

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
        user: session.user,
        tokenValidUntil: session.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
