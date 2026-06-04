import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Define interface for JWT payload
interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== AUTH ROUTES ====================

// REGISTER endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;
        
        console.log('Registration attempt for:', email);
        
        // Check if user exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
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
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '15m' }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, full_name: user.full_name },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGIN endpoint
app.post('/api/auth/login', async (req, res) => {
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
        
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '15m' }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// REFRESH TOKEN endpoint
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret') as any;
        
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
            [refreshToken]
        );
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }
        
        const userResult = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        const user = userResult.rows[0];
        
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '15m' }
        );
        
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

// ==================== PROPERTY ROUTES ====================

// CREATE property (authenticated)
app.post('/api/properties', authenticateToken, async (req: any, res: any) => {
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
                latitude, longitude, images, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                uuidv4(), req.user.userId, title, description, property_type, transaction_type,
                price, area_sqft, bedrooms || 0, bathrooms || 0, city, location,
                latitude || null, longitude || null, images || [], 'active'
            ]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});

// GET all properties (public)
app.get('/api/properties', async (req, res) => {
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
        
        // Sorting
        const allowedSortColumns = ['price', 'created_at', 'area_sqft', 'bedrooms'];
        const sortColumn = allowedSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
        const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY p.${sortColumn} ${order}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        
        // Get total count
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
            success: true,
            data: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// GET single property by ID
app.get('/api/properties/:id', async (req, res) => {
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
        console.error('Get property error:', error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
});

// ==================== SIMILAR PROPERTIES ====================
app.get('/api/properties/similar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the source property details
        const sourceProperty = await pool.query(
            `SELECT city, property_type, price, bedrooms 
             FROM properties WHERE id = $1 AND status = 'active'`,
            [id]
        );
        
        if (sourceProperty.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        const { city, property_type, price, bedrooms } = sourceProperty.rows[0];
        
        // Find similar properties
        const similarProperties = await pool.query(
            `SELECT p.*, u.full_name as owner_name, u.email as owner_email
             FROM properties p
             JOIN users u ON p.user_id = u.id
             WHERE p.id != $1 
               AND p.status = 'active'
               AND (
                 p.city = $2 
                 OR p.property_type = $3
                 OR (p.price BETWEEN $4 * 0.7 AND $4 * 1.3)
                 OR p.bedrooms = $5
               )
             ORDER BY 
               CASE 
                 WHEN p.city = $2 AND p.property_type = $3 THEN 1
                 WHEN p.city = $2 THEN 2
                 WHEN p.property_type = $3 THEN 3
                 WHEN p.price BETWEEN $4 * 0.7 AND $4 * 1.3 THEN 4
                 WHEN p.bedrooms = $5 THEN 5
                 ELSE 6
               END
             LIMIT 6`,
            [id, city, property_type, price, bedrooms]
        );
        
        res.json(similarProperties.rows);
    } catch (error) {
        console.error('Similar properties error:', error);
        res.status(500).json({ error: 'Failed to fetch similar properties' });
    }
});

// ==================== UPDATE PROPERTY ====================
app.put('/api/properties/:id', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const {
            title, description, price, city, location,
            bedrooms, bathrooms, area_sqft, property_type,
            transaction_type, status
        } = req.body;
        
        // Check if property exists
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        // Check authorization
        if (propertyCheck.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `UPDATE properties 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 city = COALESCE($4, city),
                 location = COALESCE($5, location),
                 bedrooms = COALESCE($6, bedrooms),
                 bathrooms = COALESCE($7, bathrooms),
                 area_sqft = COALESCE($8, area_sqft),
                 property_type = COALESCE($9, property_type),
                 transaction_type = COALESCE($10, transaction_type),
                 status = COALESCE($11, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING *`,
            [title, description, price, city, location, bedrooms, bathrooms,
             area_sqft, property_type, transaction_type, status, id]
        );
        
        res.json({ success: true, property: result.rows[0] });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// ==================== DELETE PROPERTY ====================
app.delete('/api/properties/:id', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('DELETE FROM inquiries WHERE property_id = $1', [id]);
        await pool.query('DELETE FROM properties WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

// ==================== INQUIRY ROUTES ====================

// Create inquiry
app.post('/api/inquiries', authenticateToken, async (req: any, res: any) => {
    try {
        const { property_id, message, phone } = req.body;
        
        const propertyCheck = await pool.query(
            'SELECT id, title, user_id FROM properties WHERE id = $1',
            [property_id]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id === req.user.userId) {
            return res.status(400).json({ error: 'Cannot inquire about your own property' });
        }
        
        const duplicateCheck = await pool.query(
            `SELECT id FROM inquiries 
             WHERE property_id = $1 AND user_id = $2 
             AND created_at > NOW() - INTERVAL '1 day'`,
            [property_id, req.user.userId]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(429).json({ error: 'You have already inquired about this property recently' });
        }
        
        const result = await pool.query(
            `INSERT INTO inquiries (id, property_id, user_id, message, phone, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING *`,
            [uuidv4(), property_id, req.user.userId, message, phone || null]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Inquiry sent successfully',
            inquiry: result.rows[0] 
        });
    } catch (error) {
        console.error('Create inquiry error:', error);
        res.status(500).json({ error: 'Failed to create inquiry' });
    }
});

// Get user's inquiries
app.get('/api/inquiries/my-inquiries', authenticateToken, async (req: any, res: any) => {
    try {
        const result = await pool.query(
            `SELECT i.*, p.title as property_title, p.id as property_id,
                    p.price as property_price, p.city as property_city
             FROM inquiries i
             LEFT JOIN properties p ON i.property_id = p.id
             WHERE i.user_id = $1
             ORDER BY i.created_at DESC`,
            [req.user.userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get inquiries error:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// Get inquiries for a property (owner/admin)
app.get('/api/inquiries/property/:propertyId', authenticateToken, async (req: any, res: any) => {
    try {
        const { propertyId } = req.params;
        
        const propertyCheck = await pool.query(
            'SELECT user_id FROM properties WHERE id = $1',
            [propertyId]
        );
        
        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        if (propertyCheck.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `SELECT i.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone
             FROM inquiries i
             JOIN users u ON i.user_id = u.id
             WHERE i.property_id = $1
             ORDER BY i.created_at DESC`,
            [propertyId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Get property inquiries error:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// Update inquiry status
app.put('/api/inquiries/:id/status', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'responded', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const inquiryCheck = await pool.query(
            `SELECT i.*, p.user_id as owner_id
             FROM inquiries i
             JOIN properties p ON i.property_id = p.id
             WHERE i.id = $1`,
            [id]
        );
        
        if (inquiryCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        
        if (inquiryCheck.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `UPDATE inquiries SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        
        res.json({ success: true, inquiry: result.rows[0] });
    } catch (error) {
        console.error('Update inquiry status error:', error);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

// ==================== GET ALL INQUIRIES (Admin only) ====================
app.get('/api/admin/inquiries', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const result = await pool.query(
            `SELECT i.*, 
                    p.title as property_title, 
                    p.price as property_price,
                    p.city as property_city,
                    u.full_name as user_name,
                    u.email as user_email,
                    u.phone as user_phone
             FROM inquiries i
             LEFT JOIN properties p ON i.property_id = p.id
             LEFT JOIN users u ON i.user_id = u.id
             ORDER BY i.created_at DESC`
        );
        
        res.json({ success: true, inquiries: result.rows });
    } catch (error) {
        console.error('Get all inquiries error:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// GET ALL USERS (Admin only)
app.get('/api/admin/users', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const result = await pool.query(
            `SELECT id, email, full_name, phone, role, created_at, updated_at 
             FROM users 
             ORDER BY created_at DESC`
        );
        
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// UPDATE USER ROLE (Admin only)
app.put('/api/admin/users/:id/role', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        if (id === req.user.userId) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        
        const result = await pool.query(
            `UPDATE users 
             SET role = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING id, email, full_name, phone, role, created_at, updated_at`,
            [role, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// DELETE USER (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { id } = req.params;
        
        if (id === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await pool.query('DELETE FROM properties WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM inquiries WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET USER STATISTICS (Admin only)
app.get('/api/admin/stats', authenticateToken, async (req: any, res: any) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const propertyCount = await pool.query('SELECT COUNT(*) FROM properties');
        const inquiryCount = await pool.query('SELECT COUNT(*) FROM inquiries');
        const viewCount = await pool.query('SELECT SUM(views_count) FROM properties');
        
        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(userCount.rows[0].count),
                totalProperties: parseInt(propertyCount.rows[0].count),
                totalInquiries: parseInt(inquiryCount.rows[0].count),
                totalViews: parseInt(viewCount.rows[0].sum) || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ==================== TEST ENDPOINTS ====================
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ success: true, time: result.rows[0].time });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`✅ Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`✅ Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`✅ Properties: GET http://localhost:${PORT}/api/properties`);
    console.log(`✅ Create Property: POST http://localhost:${PORT}/api/properties`);
    console.log(`✅ Update Property: PUT http://localhost:${PORT}/api/properties/:id`);
    console.log(`✅ Delete Property: DELETE http://localhost:${PORT}/api/properties/:id`);
    console.log(`✅ Similar Properties: GET http://localhost:${PORT}/api/properties/similar/:id`);
    console.log(`✅ Inquiries: GET/POST http://localhost:${PORT}/api/inquiries`);
    console.log(`✅ Admin Inquiries: GET http://localhost:${PORT}/api/admin/inquiries`);
    console.log(`✅ Admin Users: GET http://localhost:${PORT}/api/admin/users`);
    console.log(`✅ Admin Stats: GET http://localhost:${PORT}/api/admin/stats`);
});