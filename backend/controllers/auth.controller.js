import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import crypto from 'crypto';
// Assuming you have a User model
import { generateVerificationToken } from '../utils/generateVerificationCode.js';
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';
import {
	sendPasswordResetEmail,
	sendResetSuccessEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from '../mailtrap/emails.js';

export const signup = async (req, res) => {
	const { name, password, email } = req.body;
	try {
		if (!email || !name || !password) {
			throw new Error('All fields are required');
		}

		const userAlreadyExists = await User.findOne({ email });
		if (userAlreadyExists) {
			res.status(400).json({ success: false, message: 'User already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const verificationToken = generateVerificationToken();

		const newUser = new User({
			name,
			email,
			password: hashedPassword,
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
		});

		await newUser.save();

		generateTokenAndSetCookie(res, newUser._id);
		await sendVerificationEmail(newUser.email, verificationToken);

		res.status(201).json({
			message: 'User created successfully',
			user: { ...newUser._doc, password: undefined },
		});
	} catch (error) {
		res.status(400).json({ success: false, error: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	const { code } = req.body;

	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: 'Invalid verification code' });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);

		res.status(200).json({
			success: true,
			message: 'Email verified succesfully',
			user: { ...user._doc, password: undefined },
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Invalid or expired verification code',
		});
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ error: 'Invalid credentials' });
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ error: 'Invalid credentials' });
		}
		generateTokenAndSetCookie(res, user._id);
		user.lastLogin = new Date();

		res.status(200).json({
			success: true,
			user: { ...user._doc, password: undefined },
			message: 'User logged in',
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
};

export const logout = (req, res) => {
	res.clearCookie('token');
	res.status(200).json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			res.status(400).json({ success: false, message: 'User not found' });
		}

		const resetToken = crypto.randomBytes(20).toString('hex');
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		await sendPasswordResetEmail(
			user.email,
			`${process.env.CLIENT_URL}/reset-password/${resetToken}`
		);

		res.status(200).json({
			success: true,
			message: 'Password reset link sent to your email',
		});
	} catch (error) {
		console.log(error.message);
	}
};
export const resetPassword = async (req, res) => {
	const { token } = req.params;
	const { password } = req.body;
	try {
		const user = await User.findOne({ resetPasswordToken: token });
		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: 'Invalid or expired reset token' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		user.password = hashedPassword;
		user.resetPasswordExpiresAt = undefined;
		user.resetPasswordToken = undefined;

		await user.save();

		await sendResetSuccessEmail(user.email);

		res
			.status(200)
			.json({ success: true, message: 'Password updated sucessfuly!' });
	} catch (error) {
		console.log(error.message);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select('-password');

		if (!user)
			return res
				.status(400)
				.json({ success: false, message: 'User not found' });

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log(error.message);
		res.status(400).json({ success: false, message: error.message });
	}
};
