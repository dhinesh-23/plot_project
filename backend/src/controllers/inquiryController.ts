import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createInquiry = async (req: AuthRequest, res: Response) => {
    try {
        const { property_id, message, phone } = req.body;
        
        // Check for duplicate inquiry today
        const duplicateCheck = await pool.query(
            `SELECT id FROM inquiries 
             WHERE property_id = $1 AND user_id = $2 AND DATE(created_at) = CURRENT_DATE`,
            [property_id, req.user!.id]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(429).json({ 
                error: 'You have already inquired about this property today' 
            });
        }
        
        // Get property owner info
        const propertyResult = await pool.query(
            'SELECT user_id, title FROM properties WHERE id = $1',
            [property_id]
        );
        
        if (propertyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        // Prevent self-inquiry
        if (propertyResult.rows[0].user_id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot inquire about your own property' });
        }
        
        const result = await pool.query(
            `INSERT INTO inquiries (id, property_id, user_id, message, phone, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING *`,
            [uuidv4(), property_id, req.user!.id, message, phone || null]
        );
        
        res.status(201).json({
            message: 'Inquiry sent successfully',
            inquiry: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create inquiry' });
    }
};

export const getUserInquiries = async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT i.*, p.title as property_title, p.price, p.location 
             FROM inquiries i
             JOIN properties p ON i.property_id = p.id
             WHERE i.user_id = $1
             ORDER BY i.created_at DESC`,
            [req.user!.id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
};

export const getPropertyInquiries = async (req: AuthRequest, res: Response) => {
    try {
        const { property_id } = req.params;
        
        // Check ownership
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [property_id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `SELECT i.*, u.full_name, u.email 
             FROM inquiries i
             JOIN users u ON i.user_id = u.id
             WHERE i.property_id = $1
             ORDER BY i.created_at DESC`,
            [property_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
};