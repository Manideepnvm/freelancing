const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Create a new review
router.post('/', [
    body('project_id').isInt().withMessage('Valid project ID is required'),
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments').trim().notEmpty().withMessage('Comments are required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { project_id, rating, comments } = req.body;
        const reviewerId = req.user.userId;

        // Check if project exists and is completed
        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ?',
            [project_id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has already reviewed this project
        const [existingReviews] = await db.execute(
            'SELECT * FROM reviews WHERE project_id = ? AND reviewer_id = ?',
            [project_id, reviewerId]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this project' });
        }

        // Create review
        const [result] = await db.execute(
            'INSERT INTO reviews (project_id, reviewer_id, rating, comments) VALUES (?, ?, ?, ?)',
            [project_id, reviewerId, rating, comments]
        );

        res.status(201).json({
            message: 'Review submitted successfully',
            reviewId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const [reviews] = await db.execute(`
            SELECT r.*, u.name as reviewer_name
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.project_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.projectId]);

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews by user
router.get('/user/:userId', async (req, res) => {
    try {
        const [reviews] = await db.execute(`
            SELECT r.*, p.title as project_title
            FROM reviews r
            JOIN projects p ON r.project_id = p.id
            WHERE r.reviewer_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.userId]);

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update review
router.put('/:id', [
    body('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments').optional().trim().notEmpty().withMessage('Comments cannot be empty')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { rating, comments } = req.body;
        const reviewId = req.params.id;
        const reviewerId = req.user.userId;

        // Check if review exists and belongs to user
        const [reviews] = await db.execute(
            'SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?',
            [reviewId, reviewerId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        // Update review
        await db.execute(
            'UPDATE reviews SET rating = ?, comments = ? WHERE id = ?',
            [rating || reviews[0].rating, comments || reviews[0].comments, reviewId]
        );

        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete review
router.delete('/:id', async (req, res) => {
    try {
        const reviewId = req.params.id;
        const reviewerId = req.user.userId;

        // Check if review exists and belongs to user
        const [reviews] = await db.execute(
            'SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?',
            [reviewId, reviewerId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        // Delete review
        await db.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get average rating for a freelancer
router.get('/freelancer/:freelancerId/rating', async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                AVG(r.rating) as average_rating,
                COUNT(r.id) as total_reviews
            FROM reviews r
            JOIN projects p ON r.project_id = p.id
            JOIN bids b ON p.id = b.project_id
            WHERE b.freelancer_id = ?
        `, [req.params.freelancerId]);

        res.json(stats[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 