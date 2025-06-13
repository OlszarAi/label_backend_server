import { Router } from 'express';
import { register, login, logout, profile } from '../controllers/auth.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', validateAuth, logout);
router.get('/profile', validateAuth, profile);

export { router as authRoutes };
