import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/database.service';
import { config } from '../config/config';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validation/auth.validation';
import { 
  createDefaultSubscription, 
  getCurrentSubscription,
  getSubscriptionHistory as getSubscriptionHistoryService,
  cancelSubscription as cancelUserSubscription,
  startTrialSubscription,
  createSubscription
} from '../services/subscription.service';

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

    // Create default FREE subscription for new user
    await createDefaultSubscription(user.id);

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
        ]
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

    // Get current subscription
    const subscription = await getCurrentSubscription(user.id);

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
          subscriptionType: subscription?.type || 'FREE',
          subscriptionStatus: subscription?.status || 'INACTIVE',
          subscriptionStartDate: subscription?.startDate || null,
          subscriptionEndDate: subscription?.endDate || null,
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

    // Get current subscription
    const subscription = await getCurrentSubscription(session.user.id);

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
        user: {
          ...session.user,
          subscriptionType: subscription?.type || 'FREE',
          subscriptionStatus: subscription?.status || 'INACTIVE',
          subscriptionStartDate: subscription?.startDate || null,
          subscriptionEndDate: subscription?.endDate || null,
        },
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
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get current subscription
    const subscription = await getCurrentSubscription(user.id);

    res.status(200).json({
      success: true,
      data: { 
        user: {
          ...user,
          subscriptionType: subscription?.type || 'FREE',
          subscriptionStatus: subscription?.status || 'INACTIVE',
          subscriptionStartDate: subscription?.startDate || null,
          subscriptionEndDate: subscription?.endDate || null,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { subscriptionType, subscriptionStatus, billingCycle, price } = req.body;

    // Validate subscription type
    const validTypes = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const validStatuses = ['INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL'];
    const validBillingCycles = ['MONTHLY', 'YEARLY'];

    if (subscriptionType && !validTypes.includes(subscriptionType)) {
      throw createError('Invalid subscription type', 400);
    }

    if (subscriptionStatus && !validStatuses.includes(subscriptionStatus)) {
      throw createError('Invalid subscription status', 400);
    }

    if (billingCycle && !validBillingCycles.includes(billingCycle)) {
      throw createError('Invalid billing cycle', 400);
    }

    // Calculate dates based on subscription type and billing cycle
    let startDate = new Date();
    let endDate = null;

    if (subscriptionStatus === 'ACTIVE' && subscriptionType !== 'FREE') {
      endDate = new Date();
      if (billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    }

    // Create new subscription using service
    const subscriptionData: any = {
      userId: req.user!.id,
      type: subscriptionType || 'FREE',
      status: subscriptionStatus || 'ACTIVE',
      startDate
    };

    if (billingCycle) {
      subscriptionData.billingCycle = billingCycle;
    }

    if (price) {
      subscriptionData.price = price;
    }

    if (endDate) {
      subscriptionData.endDate = endDate;
    }

    const subscription = await createSubscription(subscriptionData);

    // Get updated user data
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { 
        user: {
          ...user,
          subscriptionType: subscription.type,
          subscriptionStatus: subscription.status,
          subscriptionStartDate: subscription.startDate,
          subscriptionEndDate: subscription.endDate,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await getCurrentSubscription(req.user!.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    return next(error);
  }
};

export const getSubscriptionHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await getSubscriptionHistoryService(req.user!.id);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cancelledSubscription = await cancelUserSubscription(req.user!.id);

    if (!cancelledSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelledSubscription
    });
  } catch (error) {
    return next(error);
  }
};

export const startTrial = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { trialDays = 7 } = req.body;

    if (trialDays < 1 || trialDays > 90) {
      throw createError('Trial days must be between 1 and 90', 400);
    }

    const trialSubscription = await startTrialSubscription(req.user!.id, trialDays);

    res.status(201).json({
      success: true,
      message: 'Trial subscription created successfully',
      data: trialSubscription
    });
  } catch (error) {
    next(error);
  }
};

export const getFullProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get current subscription
    const currentSubscription = await getCurrentSubscription(userId);

    // Get subscription history
    const subscriptionHistory = await getSubscriptionHistoryService(userId);

    // Calculate stats
    const daysFromRegistration = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalSpent = subscriptionHistory.reduce((sum, sub) => {
      return sum + (sub.price ? parseFloat(sub.price.toString()) : 0);
    }, 0);

    // Get last login (from sessions)
    const lastSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const stats = {
      labelsCreated: 0, // To be implemented with labels feature
      projectsSaved: 0, // To be implemented with projects feature
      daysFromRegistration,
      totalSpent,
      lastLoginDate: lastSession?.createdAt || null,
    };

    const profileData = {
      user,
      currentSubscription,
      subscriptionHistory,
      stats,
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError('Invalid email format', 400);
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw createError('Email already taken', 409);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw createError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw createError('New password must be at least 8 characters long', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
