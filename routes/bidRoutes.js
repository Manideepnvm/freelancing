const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Create a new bid
router.post('/', [
    body('project_id').isInt().withMessage('Valid project ID is required'),
    body('bid_amount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, bid_amount } = req.body;
        const freelancerId = req.user.userId;

        // Check if user is a freelancer
        if (req.user.usertype !== 'freelancer') {
            return res.status(403).json({ message: 'Only freelancers can place bids' });
        }

        // Check if project exists
        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ?',
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if freelancer has already bid on this project
        const [existingBids] = await db.execute(
            'SELECT * FROM bids WHERE project_id = ? AND freelancer_id = ?',
            [project_id, freelancerId]
        );

        if (existingBids.length > 0) {
            return res.status(400).json({ message: 'You have already bid on this project' });
        }

        // Create bid
        const [result] = await db.execute(
            'INSERT INTO bids (project_id, bid_amount, freelancer_id) VALUES (?, ?, ?)',
            [project_id, bid_amount, freelancerId]
        );

        res.status(201).json({
            message: 'Bid placed successfully',
            bidId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all bids for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [bids] = await db.execute(`
            SELECT b.*, u.name as freelancer_name 
            FROM bids b 
            JOIN users u ON b.freelancer_id = u.id 
            WHERE b.project_id = ?
            ORDER BY b.bid_amount ASC
        `, [req.params.projectId]);

        res.json(bids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get bids by freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const [bids] = await db.execute(`
            SELECT b.*, p.title as project_title, p.budget as project_budget
            FROM bids b
            JOIN projects p ON b.project_id = p.id
            WHERE b.freelancer_id = ?
            ORDER BY b.created_at DESC
        `, [req.params.freelancerId]);

        res.json(bids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bid
router.put('/:id', [
    body('bid_amount').isFloat({ min: 0 }).withMessage('Bid amount must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { bid_amount } = req.body;
        const bidId = req.params.id;
        const freelancerId = req.user.userId;

        // Check if bid exists and belongs to freelancer
        const [bids] = await db.execute(
            'SELECT * FROM bids WHERE id = ? AND freelancer_id = ?',
            [bidId, freelancerId]
        );

        if (bids.length === 0) {
            return res.status(404).json({ message: 'Bid not found or unauthorized' });
        }

        // Update bid
        await db.execute(
            'UPDATE bids SET bid_amount = ? WHERE id = ?',
            [bid_amount, bidId]
        );

        res.json({ message: 'Bid updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bid
router.delete('/:id', async (req, res) => {
    try {
        const bidId = req.params.id;
        const freelancerId = req.user.userId;

        // Check if bid exists and belongs to freelancer
        const [bids] = await db.execute(
            'SELECT * FROM bids WHERE id = ? AND freelancer_id = ?',
            [bidId, freelancerId]
        );

        if (bids.length === 0) {
            return res.status(404).json({ message: 'Bid not found or unauthorized' });
        }

        // Delete bid
        await db.execute('DELETE FROM bids WHERE id = ?', [bidId]);

        res.json({ message: 'Bid deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 