const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate Limiter: 5 attempts per 3 hours
const loginLimiter = rateLimit({
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 3 horas.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
