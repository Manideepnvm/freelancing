const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Register user
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('usertype').isIn(['client', 'freelancer']).withMessage('Invalid user type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, usertype } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, usertype) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, usertype]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, usertype: user.usertype },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                usertype: user.usertype
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, usertype, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // If user is a freelancer, get their skills
        if (user.usertype === 'freelancer') {
            const [skills] = await db.execute(
                'SELECT * FROM skills WHERE freelancer_id = ?',
                [user.id]
            );
            user.skills = skills;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile/:id', [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const [users] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user
        await db.execute(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name || users[0].name, email || users[0].email, userId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add/Update freelancer skills
router.post('/skills/:id', [
    body('skill_name').trim().notEmpty().withMessage('Skill name is required'),
    body('proficiency_level').isIn(['Beginner', 'Intermediate', 'Expert']).withMessage('Invalid proficiency level')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { skill_name, proficiency_level } = req.body;
        const freelancerId = req.params.id;

        // Check if user is a freelancer
        const [users] = await db.execute(
            'SELECT usertype FROM users WHERE id = ?',
            [freelancerId]
        );

        if (users.length === 0 || users[0].usertype !== 'freelancer') {
            return res.status(400).json({ message: 'Invalid freelancer' });
        }

        // Check if skill already exists
        const [existingSkills] = await db.execute(
            'SELECT * FROM skills WHERE freelancer_id = ? AND skill_name = ?',
            [freelancerId, skill_name]
        );

        if (existingSkills.length > 0) {
            // Update existing skill
            await db.execute(
                'UPDATE skills SET proficiency_level = ? WHERE freelancer_id = ? AND skill_name = ?',
                [proficiency_level, freelancerId, skill_name]
            );
        } else {
            // Add new skill
            await db.execute(
                'INSERT INTO skills (freelancer_id, skill_name, proficiency_level) VALUES (?, ?, ?)',
                [freelancerId, skill_name, proficiency_level]
            );
        }

        res.json({ message: 'Skills updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 