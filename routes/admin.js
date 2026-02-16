import express from 'express';
import { User, Transaction, Admin } from '../models/index.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
    try {
        const userCount = await User.count();
        const transactionCount = await Transaction.count();
        const recentTransactions = await Transaction.findAll({ limit: 5, order: [['createdAt', 'DESC']], include: [User] });

        res.json({
            stats: {
                users: userCount,
                transactions: transactionCount,
            },
            recentTransactions
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/customers', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.findAll({ order: [['createdAt', 'DESC']] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/transactions', protect, authorize('admin'), async (req, res) => {
    try {
        const transactions = await Transaction.findAll({ include: [User], order: [['createdAt', 'DESC']] });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Admin.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: '10d' });

        res.status(200).json({ message: 'Login successful', token, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, key } = req.body;
        const envKey = process.env.ADMIN_CREATION_KEY

        if (!envKey || !key || key !== envKey) {
            return res.status(403).json({ message: 'Not Authenticated Request' })
        }

        const existingAdmin = await Admin.findOne({ where: { email } });

        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: '10d' });

        res.status(201).json({ message: 'User created successfully', token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
