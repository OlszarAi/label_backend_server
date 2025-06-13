import { Router } from 'express';
import { register, login, logout, profile, getSessionStatus } from '../controllers/auth.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', validateAuth, logout);
router.get('/profile', validateAuth, profile);
router.get('/session', validateAuth, getSessionStatus);

export { router as authRoutes };
