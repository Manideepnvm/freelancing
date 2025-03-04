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
const validateReview = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments').trim().notEmpty().withMessage('Comments are required')
];

// Create review
router.post('/', validateReview, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, reviewer_id, rating, comments } = req.body;

        // Check if project exists and is completed
        const [projects] = await db.promise().query(
            'SELECT * FROM projects WHERE id = ? AND status = "completed"',
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(400).json({ message: 'Project not found or not completed' });
        }

        // Check if reviewer has already reviewed this project
        const [existingReviews] = await db.promise().query(
            'SELECT * FROM reviews WHERE project_id = ? AND reviewer_id = ?',
            [project_id, reviewer_id]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this project' });
        }

        const [result] = await db.promise().query(
            'INSERT INTO reviews (project_id, reviewer_id, rating, comments) VALUES (?, ?, ?, ?)',
            [project_id, reviewer_id, rating, comments]
        );

        res.status(201).json({ message: 'Review created successfully', reviewId: result.insertId });
    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [reviews] = await db.promise().query(`
            SELECT r.*, u.name as reviewer_name 
            FROM reviews r 
            JOIN users u ON r.reviewer_id = u.id 
            WHERE r.project_id = ? 
            ORDER BY r.created_at DESC
        `, [req.params.projectId]);

        res.json(reviews);
    } catch (error) {
        console.error('Get project reviews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews by user
router.get('/user/:userId', async (req, res) => {
    try {
        const [reviews] = await db.promise().query(`
            SELECT r.*, p.title as project_title 
            FROM reviews r 
            JOIN projects p ON r.project_id = p.id 
            WHERE r.reviewer_id = ? 
            ORDER BY r.created_at DESC
        `, [req.params.userId]);

        res.json(reviews);
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update review
router.put('/:id', async (req, res) => {
    try {
        const { rating, comments } = req.body;

        await db.promise().query(
            'UPDATE reviews SET rating = ?, comments = ? WHERE id = ?',
            [rating, comments, req.params.id]
        );

        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        console.error('Review update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete review
router.delete('/:id', async (req, res) => {
    try {
        await db.promise().query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Review deletion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get average rating for a freelancer
router.get('/freelancer/:freelancerId/rating', async (req, res) => {
    try {
        const [ratings] = await db.promise().query(`
            SELECT AVG(r.rating) as average_rating, COUNT(r.id) as total_reviews
            FROM reviews r
            JOIN projects p ON r.project_id = p.id
            WHERE p.freelancer_id = ?
        `, [req.params.freelancerId]);

        res.json(ratings[0]);
    } catch (error) {
        console.error('Get freelancer rating error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 