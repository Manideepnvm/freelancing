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
const validatePayment = [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('project_id').isNumeric().withMessage('Project ID is required'),
    body('client_id').isNumeric().withMessage('Client ID is required'),
    body('freelancer_id').isNumeric().withMessage('Freelancer ID is required')
];

// Create payment
router.post('/', validatePayment, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount, project_id, client_id, freelancer_id, transaction_id } = req.body;

        // Check if project exists and is in progress
        const [projects] = await db.promise().query(
            'SELECT * FROM projects WHERE id = ? AND status = "in_progress"',
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(400).json({ message: 'Project not found or not in progress' });
        }

        const [result] = await db.promise().query(
            'INSERT INTO payments (amount, project_id, client_id, freelancer_id, transaction_id) VALUES (?, ?, ?, ?, ?)',
            [amount, project_id, client_id, freelancer_id, transaction_id]
        );

        res.status(201).json({ message: 'Payment created successfully', paymentId: result.insertId });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [payments] = await db.promise().query(`
            SELECT p.*, 
                   c.name as client_name, 
                   f.name as freelancer_name 
            FROM payments p 
            JOIN users c ON p.client_id = c.id 
            JOIN users f ON p.freelancer_id = f.id 
            WHERE p.project_id = ? 
            ORDER BY p.payment_date DESC
        `, [req.params.projectId]);

        res.json(payments);
    } catch (error) {
        console.error('Get project payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments by client
router.get('/client/:clientId', async (req, res) => {
    try {
        const [payments] = await db.promise().query(`
            SELECT p.*, 
                   pr.title as project_title, 
                   f.name as freelancer_name 
            FROM payments p 
            JOIN projects pr ON p.project_id = pr.id 
            JOIN users f ON p.freelancer_id = f.id 
            WHERE p.client_id = ? 
            ORDER BY p.payment_date DESC
        `, [req.params.clientId]);

        res.json(payments);
    } catch (error) {
        console.error('Get client payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments by freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const [payments] = await db.promise().query(`
            SELECT p.*, 
                   pr.title as project_title, 
                   c.name as client_name 
            FROM payments p 
            JOIN projects pr ON p.project_id = pr.id 
            JOIN users c ON p.client_id = c.id 
            WHERE p.freelancer_id = ? 
            ORDER BY p.payment_date DESC
        `, [req.params.freelancerId]);

        res.json(payments);
    } catch (error) {
        console.error('Get freelancer payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update payment status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.promise().query(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        // If payment is completed, update project status
        if (status === 'completed') {
            const [payments] = await db.promise().query(
                'SELECT project_id FROM payments WHERE id = ?',
                [req.params.id]
            );

            if (payments.length > 0) {
                await db.promise().query(
                    'UPDATE projects SET status = "completed" WHERE id = ?',
                    [payments[0].project_id]
                );
            }
        }

        res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Payment status update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;