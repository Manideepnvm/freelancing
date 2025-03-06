const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Create a new project
router.post('/', [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, budget } = req.body;
        const clientId = req.user.userId; // From auth middleware

        const [result] = await db.execute(
            'INSERT INTO projects (title, description, budget, client_id) VALUES (?, ?, ?, ?)',
            [title, description, budget, clientId]
        );

        res.status(201).json({
            message: 'Project created successfully',
            projectId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all projects
router.get('/', async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.*, u.name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id 
            ORDER BY p.created_at DESC
        `);

        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const [projects] = await db.execute(`
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
        const [bids] = await db.execute(`
            SELECT b.*, u.name as freelancer_name 
            FROM bids b 
            JOIN users u ON b.freelancer_id = u.id 
            WHERE b.project_id = ?
        `, [project.id]);

        project.bids = bids;

        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update project
router.put('/:id', [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, budget } = req.body;
        const projectId = req.params.id;
        const clientId = req.user.userId;

        // Check if project exists and belongs to client
        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ? AND client_id = ?',
            [projectId, clientId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Update project
        await db.execute(
            'UPDATE projects SET title = ?, description = ?, budget = ? WHERE id = ?',
            [title || projects[0].title, description || projects[0].description, budget || projects[0].budget, projectId]
        );

        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const clientId = req.user.userId;

        // Check if project exists and belongs to client
        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ? AND client_id = ?',
            [projectId, clientId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Delete project (cascade will handle related records)
        await db.execute('DELETE FROM projects WHERE id = ?', [projectId]);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get projects by client
router.get('/client/:clientId', async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.*, 
                   COUNT(b.id) as bid_count,
                   AVG(b.bid_amount) as avg_bid_amount
            FROM projects p
            LEFT JOIN bids b ON p.id = b.project_id
            WHERE p.client_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [req.params.clientId]);

        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 