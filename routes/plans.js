import express from 'express';
import { Plan } from '../models/index.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

// Get all plans
router.get('/getPlanList', async (req, res) => {
    try {
        const plans = await Plan.findAll({ order: [['createdAt', 'DESC']] });
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a single plan by ID
router.get('/getPlanById', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.query
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

// Create a new plan
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, price, currency, credits, features, maxDevices, dailyLimit } = req.body;

        // Validation
        if (!name || !price || !credits) {
            return res.status(400).json({ message: 'Name, price, and credits are required' });
        }

        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ message: 'Price must be a non-negative number' });
        }

        if (typeof credits !== 'number' || credits < 0) {
            return res.status(400).json({ message: 'Credits must be a non-negative number' });
        }

        const plan = await Plan.create({
            name,
            price,
            currency: currency || 'INR',
            credits,
            features: features || [],
            maxDevices: maxDevices || 1,
            dailyLimit: dailyLimit || 100
        });

        res.status(201).json({ message: 'Plan created successfully', plan });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a plan
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, price, currency, credits, features, maxDevices, dailyLimit } = req.body;
        const plan = await Plan.findByPk(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Validation
        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ message: 'Price must be a non-negative number' });
        }

        if (credits !== undefined && (typeof credits !== 'number' || credits < 0)) {
            return res.status(400).json({ message: 'Credits must be a non-negative number' });
        }

        // Update fields
        if (name !== undefined) plan.name = name;
        if (price !== undefined) plan.price = price;
        if (currency !== undefined) plan.currency = currency;
        if (credits !== undefined) plan.credits = credits;
        if (features !== undefined) plan.features = features;
        if (maxDevices !== undefined) plan.maxDevices = maxDevices;
        if (dailyLimit !== undefined) plan.dailyLimit = dailyLimit;

        await plan.save();

        res.json({ message: 'Plan updated successfully', plan });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a plan
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const plan = await Plan.findByPk(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        await plan.destroy();

        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
