const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Create a new payment
router.post('/', [
    body('project_id').isInt().withMessage('Valid project ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, amount } = req.body;
        const clientId = req.user.userId;

        // Check if user is a client
        if (req.user.usertype !== 'client') {
            return res.status(403).json({ message: 'Only clients can make payments' });
        }

        // Check if project exists and belongs to client
        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ? AND client_id = ?',
            [project_id, clientId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Create payment
        const [result] = await db.execute(
            'INSERT INTO payments (amount, payment_date, status, project_id) VALUES (?, CURDATE(), "Pending", ?)',
            [amount, project_id]
        );

        res.status(201).json({
            message: 'Payment initiated successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [payments] = await db.execute(
            'SELECT * FROM payments WHERE project_id = ? ORDER BY payment_date DESC',
            [req.params.projectId]
        );

        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments by client
router.get('/client/:clientId', async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT p.*, pr.title as project_title
            FROM payments p
            JOIN projects pr ON p.project_id = pr.id
            WHERE pr.client_id = ?
            ORDER BY p.payment_date DESC
        `, [req.params.clientId]);

        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update payment status
router.put('/:id/status', [
    body('status').isIn(['Pending', 'Completed', 'Failed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;
        const paymentId = req.params.id;

        // Check if payment exists
        const [payments] = await db.execute(
            'SELECT * FROM payments WHERE id = ?',
            [paymentId]
        );

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Update payment status
        await db.execute(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, paymentId]
        );

        res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payment statistics
router.get('/stats/:clientId', async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_payments,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_payments,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed_payments,
                SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as total_amount
            FROM payments p
            JOIN projects pr ON p.project_id = pr.id
            WHERE pr.client_id = ?
        `, [req.params.clientId]);

        res.json(stats[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;