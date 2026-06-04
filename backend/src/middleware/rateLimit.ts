import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

export const rateLimiter = (endpoint: string, maxRequests: number = 5, windowMs: number = 900000) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const identifier = (req as any).user?.id || req.ip;
        
        try {
            const now = new Date();
            const windowStart = new Date(now.getTime() - windowMs);
            
            // Clean up old records
            await pool.query(
                'DELETE FROM rate_limits WHERE window_start < $1',
                [windowStart]
            );
            
            // Check current request count
            const result = await pool.query(
                `INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) 
                 VALUES ($1, $2, 1, $3)
                 ON CONFLICT (identifier, endpoint, window_start) 
                 DO UPDATE SET request_count = rate_limits.request_count + 1
                 RETURNING request_count`,
                [identifier, endpoint, now]
            );
            
            const requestCount = result.rows[0].request_count;
            
            if (requestCount > maxRequests) {
                return res.status(429).json({ 
                    error: 'Too many requests. Please try again later.' 
                });
            }
            
            next();
        } catch (error) {
            console.error('Rate limit error:', error);
            next();
        }
    };
};