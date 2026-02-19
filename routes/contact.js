import express from 'express';
import { Op } from 'sequelize';
import { Contact, User } from '../models/index.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/contact — logged-in users submit a message
router.post('/', protect, async (req, res) => {
    try {
        const { description } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({ message: 'Description is required' });
        }

        // Fetch full user info so we have name + email
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const contact = await Contact.create({
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            description: description.trim(),
        });

        res.status(201).json({ message: 'Message sent successfully', id: contact.id });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/contact — admin only, list all contacts newest first
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const contacts = await Contact.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/contact/:id — admin only, delete a single contact
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        await contact.destroy();
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
