import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { sendOTP } from '../config/email.js';

const router = express.Router();

// POST /api/auth/forgot-password/request-otp
// Send OTP to user's email
router.post('/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });

        // For security, don't reveal if email exists
        // But check internally and only send if user exists
        if (!user) {
            // Return success to prevent email enumeration
            return res.status(200).json({
                message: 'If this email exists, an OTP has been sent.'
            });
        }

        // Check if user uses Google OAuth
        if (user.authProvider === 'google') {
            return res.status(400).json({
                message: 'This account uses Google login. Please sign in with Google.'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before storing
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Set OTP expiry (10 minutes from now)
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Update user with OTP data
        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = otpExpiry;
        user.resetOtpAttempts = 0; // Reset attempts
        await user.save();

        // Send OTP via email
        await sendOTP(email, otp, user.name);

        res.status(200).json({
            message: 'OTP has been sent to your email address.'
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({
            message: 'Failed to send OTP. Please try again later.',
            error: error.message
        });
    }
});

// POST /api/auth/forgot-password/verify-otp
// Verify OTP and return reset token
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or OTP' });
        }

        // Check if OTP exists
        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({
                message: 'No OTP found. Please request a new one.'
            });
        }

        // Check if OTP has expired
        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check attempt limit
        if (user.resetOtpAttempts >= 5) {
            return res.status(400).json({
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, user.resetOtp);

        if (!isValid) {
            // Increment attempt counter
            user.resetOtpAttempts += 1;
            await user.save();

            return res.status(400).json({
                message: `Invalid OTP. ${5 - user.resetOtpAttempts} attempts remaining.`
            });
        }

        // OTP is valid - generate reset token
        const resetToken = jwt.sign(
            { id: user.id, email: user.email, purpose: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Token valid for 15 minutes
        );

        res.status(200).json({
            message: 'OTP verified successfully',
            resetToken
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            message: 'Failed to verify OTP. Please try again.',
            error: error.message
        });
    }
});

// POST /api/auth/forgot-password/reset-password
// Reset password using reset token
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                message: 'Reset token and new password are required'
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token was issued for password reset
        if (decoded.purpose !== 'password-reset') {
            return res.status(400).json({
                message: 'Invalid reset token'
            });
        }

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP fields
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        user.resetOtpAttempts = 0;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: 'Failed to reset password. Please try again.',
            error: error.message
        });
    }
});

export default router;
