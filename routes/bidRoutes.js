const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { body, validationResult } = require('express-validator');

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Validation middleware
const validateBid = [
    body('bid_amount').isNumeric().withMessage('Bid amount must be a number'),
    body('proposal').trim().notEmpty().withMessage('Proposal is required')
];

// Create bid
router.post('/', validateBid, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, bid_amount, proposal, freelancer_id } = req.body;

        // Check if project exists and is open
        const [projects] = await db.promise().query(
            'SELECT * FROM projects WHERE id = ? AND status = "open"',
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(400).json({ message: 'Project not found or not open for bidding' });
        }

        // Check if freelancer has already bid on this project
        const [existingBids] = await db.promise().query(
            'SELECT * FROM bids WHERE project_id = ? AND freelancer_id = ?',
            [project_id, freelancer_id]
        );

        if (existingBids.length > 0) {
            return res.status(400).json({ message: 'You have already bid on this project' });
        }

        const [result] = await db.promise().query(
            'INSERT INTO bids (project_id, bid_amount, proposal, freelancer_id) VALUES (?, ?, ?, ?)',
            [project_id, bid_amount, proposal, freelancer_id]
        );

        res.status(201).json({ message: 'Bid placed successfully', bidId: result.insertId });
    } catch (error) {
        console.error('Bid creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get bids for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [bids] = await db.promise().query(`
            SELECT b.*, u.name as freelancer_name 
            FROM bids b 
            JOIN users u ON b.freelancer_id = u.id 
            WHERE b.project_id = ? 
            ORDER BY b.created_at DESC
        `, [req.params.projectId]);

        res.json(bids);
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get bids by freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const [bids] = await db.promise().query(`
            SELECT b.*, p.title as project_title 
            FROM bids b 
            JOIN projects p ON b.project_id = p.id 
            WHERE b.freelancer_id = ? 
            ORDER BY b.created_at DESC
        `, [req.params.freelancerId]);

        res.json(bids);
    } catch (error) {
        console.error('Get freelancer bids error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update bid status (accept/reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Get bid details
        const [bids] = await db.promise().query(
            'SELECT * FROM bids WHERE id = ?',
            [req.params.id]
        );

        if (bids.length === 0) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const bid = bids[0];

        // Update bid status
        await db.promise().query(
            'UPDATE bids SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        // If bid is accepted, update project status and assign freelancer
        if (status === 'accepted') {
            await db.promise().query(
                'UPDATE projects SET status = "in_progress", freelancer_id = ? WHERE id = ?',
                [bid.freelancer_id, bid.project_id]
            );
        }

        res.json({ message: 'Bid status updated successfully' });
    } catch (error) {
        console.error('Bid status update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete bid
router.delete('/:id', async (req, res) => {
    try {
        await db.promise().query('DELETE FROM bids WHERE id = ?', [req.params.id]);
        res.json({ message: 'Bid deleted successfully' });
    } catch (error) {
        console.error('Bid deletion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 