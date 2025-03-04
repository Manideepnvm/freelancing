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
const validateProject = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('budget').isNumeric().withMessage('Budget must be a number'),
    body('deadline').isDate().withMessage('Invalid deadline date')
];

// Create project
router.post('/', validateProject, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, budget, deadline, client_id } = req.body;

        const [result] = await db.promise().query(
            'INSERT INTO projects (title, description, budget, deadline, client_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, budget, deadline, client_id]
        );

        res.status(201).json({ message: 'Project created successfully', projectId: result.insertId });
    } catch (error) {
        console.error('Project creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all projects
router.get('/', async (req, res) => {
    try {
        const [projects] = await db.promise().query(`
            SELECT p.*, u.name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id 
            ORDER BY p.created_at DESC
        `);

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const [projects] = await db.promise().query(`
            SELECT p.*, u.name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id 
            WHERE p.id = ?
        `, [req.params.id]);

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projects[0];

        // Get bids for this project
        const [bids] = await db.promise().query(`
            SELECT b.*, u.name as freelancer_name 
            FROM bids b 
            JOIN users u ON b.freelancer_id = u.id 
            WHERE b.project_id = ?
        `, [project.id]);

        project.bids = bids;

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    try {
        const { title, description, budget, deadline, status } = req.body;

        await db.promise().query(
            'UPDATE projects SET title = ?, description = ?, budget = ?, deadline = ?, status = ? WHERE id = ?',
            [title, description, budget, deadline, status, req.params.id]
        );

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Project update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        await db.promise().query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Project deletion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get projects by client
router.get('/client/:clientId', async (req, res) => {
    try {
        const [projects] = await db.promise().query(
            'SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC',
            [req.params.clientId]
        );

        res.json(projects);
    } catch (error) {
        console.error('Get client projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get projects by freelancer (through bids)
router.get('/freelancer/:freelancerId', async (req, res) => {
    try {
        const [projects] = await db.promise().query(`
            SELECT p.*, b.bid_amount, b.status as bid_status 
            FROM projects p 
            JOIN bids b ON p.id = b.project_id 
            WHERE b.freelancer_id = ? 
            ORDER BY p.created_at DESC
        `, [req.params.freelancerId]);

        res.json(projects);
    } catch (error) {
        console.error('Get freelancer projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 