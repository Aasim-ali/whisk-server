import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Transaction, User, Plan } from '../models/index.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get Razorpay Key
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// Create Order
router.post('/order', async (req, res) => {
    try {
        const { planId, userId } = req.body;

        const plan = await Plan.findByPk(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const amount = plan.price; // Price is already in smallest currency unit (paise)

        const options = {
            amount: amount,
            currency: plan.currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        if (!order) return res.status(500).send('Some error occured');

        res.json(order);
    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).send(error);
    }
});

// Verify Payment
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            userId,
            planId
        } = req.body;

        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpaySignature) {
            return res.status(400).json({ msg: 'Transaction not legit!' });
        }

        const plan = await Plan.findByPk(planId);
        const user = await User.findByPk(userId);

        if (!plan || !user) {
            return res.status(404).json({ message: 'User or Plan not found' });
        }

        // Save transaction
        await Transaction.create({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            status: 'success',
            amount: plan.price,
            userId: userId,
            planId: planId
        });

        // Add credits to user and update plan
        user.credits += plan.credits;
        user.planId = plan.id;
        await user.save();

        res.json({
            msg: 'success',
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            newCredits: user.credits
        });
    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).send(error);
    }
});

export default router;
