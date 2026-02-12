import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';

const router = express.Router();

// @route   GET /api/oauth/google
// @desc    Initiate Google OAuth flow
// @access  Public
// @route   GET /api/oauth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', (req, res, next) => {
    const isExtension = req.query.extension === 'true';
    const state = isExtension ? 'extension' : 'web';

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

router.get('/test', (req, res) => {
    res.send('Test');
});

// @route   GET /api/oauth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = jwt.sign(
                { id: req.user.id, email: req.user.email },
                process.env.JWT_SECRET,
                { expiresIn: '10d' }
            );

            const user = {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                profilePicture: req.user.profilePicture
            };

            // Check state from callback
            const state = req.query.state;
            const isExtension = state === 'extension';

            if (isExtension) {
                // Redirect to extension callback page with token
                res.redirect(`${process.env.CLIENT_URL}/extension-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
            } else {
                // Redirect to client dashboard with token in URL (will be captured by client)
                res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
        }
    }
);

// @route   POST /api/oauth/google/verify
// @desc    Verify Google token and return JWT (alternative flow for client-side Google Sign-In)
// @access  Public
router.post('/google/verify', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'No credential provided' });
        }

        // Verify Google token (you'd typically use google-auth-library for this)
        // For now, we'll use passport strategy as the primary method
        // This endpoint can be enhanced with google-auth-library if needed

        res.status(501).json({ message: 'Use OAuth flow (/api/oauth/google) instead' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
