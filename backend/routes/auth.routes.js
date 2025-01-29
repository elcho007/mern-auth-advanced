import express from 'express';

import {
	signup,
	login,
	logout,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Mock user database

router.get('/check-auth', verifyToken, checkAuth);
// Signup route

router.post('/signup', signup);

// Login route
router.post('/login', login);

// Logout route
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
