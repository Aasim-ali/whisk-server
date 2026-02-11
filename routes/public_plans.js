import express from 'express';
import { Plan } from '../models/index.js';

const router = express.Router();

// Get all plans (Public)
router.get('/getPlanList', async (req, res) => {
    try {
        const plans = await Plan.findAll({ order: [['price', 'ASC']] });
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single plan (Public)
router.get('/getPlanById', async (req, res) => {
    try {
        const { id } = req.query;
        const plan = await Plan.findByPk(id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json(plan);
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
