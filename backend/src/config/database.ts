import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Option 1: Using connection string
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Option 2: Using config object (fallback)
export const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'realestate_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout
});

// Add connection error handler
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Test database connection with better error handling
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        client.release();
    } catch (err) {
        console.error('❌ Error connecting to database:', err);
        console.log('📝 Please check:');
        console.log('   1. PostgreSQL is running');
        console.log('   2. Password in .env is correct');
        console.log('   3. Database name is correct');
    }
};

testConnection();