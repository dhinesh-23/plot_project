import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const createProperty = async (req: AuthRequest, res: Response) => {
    try {
        const {
            title, description, property_type, transaction_type,
            price, area_sqft, bedrooms, bathrooms, city, location,
            latitude, longitude, images
        } = req.body;
        
        const result = await pool.query(
            `INSERT INTO properties (
                id, user_id, title, description, property_type, transaction_type,
                price, area_sqft, bedrooms, bathrooms, city, location,
                latitude, longitude, images
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                uuidv4(), req.user!.id, title, description, property_type, transaction_type,
                price, area_sqft, bedrooms, bathrooms, city, location,
                latitude, longitude, images || []
            ]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create property' });
    }
};

export const getProperties = async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            city,
            minPrice,
            maxPrice,
            property_type,
            bedrooms,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;
        
        const offset = (Number(page) - 1) * Number(limit);
        const params: any[] = [];
        let paramIndex = 1;
        
        let query = `
            SELECT p.*, u.full_name as owner_name, u.email as owner_email
            FROM properties p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'active'
        `;
        
        // Dynamic filters
        if (city) {
            query += ` AND p.city ILIKE $${paramIndex++}`;
            params.push(`%${city}%`);
        }
        
        if (minPrice) {
            query += ` AND p.price >= $${paramIndex++}`;
            params.push(minPrice);
        }
        
        if (maxPrice) {
            query += ` AND p.price <= $${paramIndex++}`;
            params.push(maxPrice);
        }
        
        if (property_type) {
            query += ` AND p.property_type = $${paramIndex++}`;
            params.push(property_type);
        }
        
        if (bedrooms) {
            query += ` AND p.bedrooms >= $${paramIndex++}`;
            params.push(bedrooms);
        }
        
        // Sorting with safe column validation
        const allowedSortColumns = ['price', 'created_at', 'area_sqft', 'bedrooms'];
        const sortColumn = allowedSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
        const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY p.${sortColumn} ${order}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        
        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) FROM properties p WHERE p.status = 'active'`;
        const countParams: any[] = [];
        let countIndex = 1;
        
        if (city) {
            countQuery += ` AND p.city ILIKE $${countIndex++}`;
            countParams.push(`%${city}%`);
        }
        if (minPrice) {
            countQuery += ` AND p.price >= $${countIndex++}`;
            countParams.push(minPrice);
        }
        if (maxPrice) {
            countQuery += ` AND p.price <= $${countIndex++}`;
            countParams.push(maxPrice);
        }
        if (property_type) {
            countQuery += ` AND p.property_type = $${countIndex++}`;
            countParams.push(property_type);
        }
        
        const [result, totalResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);
        
        const total = parseInt(totalResult.rows[0].count);
        
        res.json({
            data: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
};

export const getPropertyById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // Increment view count
        await pool.query(
            'UPDATE properties SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );
        
        const result = await pool.query(
            `SELECT p.*, u.full_name as owner_name, u.email as owner_email, u.phone as owner_phone
             FROM properties p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = $1 AND p.status = 'active'`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // Check ownership
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to update this property' });
        }
        
        const updates = req.body;
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [id, ...Object.values(updates)];
        
        const result = await pool.query(
            `UPDATE properties SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 RETURNING *`,
            values
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperty = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // Check ownership
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to delete this property' });
        }
        
        await pool.query('DELETE FROM properties WHERE id = $1', [id]);
        
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};

export const getSimilarProperties = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { limit = 5 } = req.query;
        
        // Get current property details
        const propertyResult = await pool.query(
            'SELECT city, property_type, price, bedrooms FROM properties WHERE id = $1',
            [id]
        );
        
        if (propertyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        const property = propertyResult.rows[0];
        
        // Find similar properties based on multiple criteria
        const similarQuery = `
            SELECT p.*, u.full_name as owner_name,
                   (CASE 
                       WHEN p.city = $1 THEN 30
                       WHEN p.property_type = $2 THEN 20
                       WHEN ABS(p.price - $3) / $3 < 0.2 THEN 15
                       WHEN ABS(p.bedrooms - $4) <= 1 THEN 10
                       ELSE 0
                   END) as similarity_score
            FROM properties p
            JOIN users u ON p.user_id = u.id
            WHERE p.id != $5 
              AND p.status = 'active'
              AND (p.city = $1 OR p.property_type = $2)
            ORDER BY similarity_score DESC, p.created_at DESC
            LIMIT $6
        `;
        
        const result = await pool.query(similarQuery, [
            property.city, property.property_type, property.price, 
            property.bedrooms, id, limit
        ]);
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch similar properties' });
    }
};