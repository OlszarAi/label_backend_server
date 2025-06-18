import { Router } from 'express';
import { 
    register, 
    login, 
    logout, 
    profile, 
    getSessionStatus, 
    updateSubscription,
    getActiveSubscription,
    getSubscriptionHistory,
    cancelSubscription,
    startTrial,
    getFullProfile,
    updateProfile,
    changePassword
} from '../controllers/auth.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', validateAuth, logout);
router.get('/profile', validateAuth, profile);
router.get('/profile/full', validateAuth, getFullProfile);
router.put('/profile', validateAuth, updateProfile);
router.post('/change-password', validateAuth, changePassword);
router.get('/session', validateAuth, getSessionStatus);

// Subscription routes
router.put('/subscription', validateAuth, updateSubscription);
router.get('/subscription/active', validateAuth, getActiveSubscription);
router.get('/subscription/history', validateAuth, getSubscriptionHistory);
router.post('/subscription/cancel', validateAuth, cancelSubscription);
router.post('/subscription/trial', validateAuth, startTrial);

export { router as authRoutes };
