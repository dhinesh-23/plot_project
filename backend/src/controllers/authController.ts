import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, full_name, phone } = req.body;
        
        // Check if user exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10'));
        
        // Create user
        const result = await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, phone) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, email, full_name, role`,
            [uuidv4(), email, hashedPassword, full_name, phone]
        );
        
        const user = result.rows[0];
        
        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        );
        
        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await pool.query(
            `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
             VALUES ($1, $2, $3, $4)`,
            [uuidv4(), user.id, refreshToken, expiresAt]
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, full_name: user.full_name },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        );
        
        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await pool.query(
            `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
             VALUES ($1, $2, $3, $4)`,
            [uuidv4(), user.id, refreshToken, expiresAt]
        );
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
        
        // Check if token exists in database
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
            [refreshToken]
        );
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }
        
        // Get user info
        const userResult = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        const user = userResult.rows[0];
        
        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );
        
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error(error);
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await pool.query(
                'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
                [refreshToken]
            );
        }
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};