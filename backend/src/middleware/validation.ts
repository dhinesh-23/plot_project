import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateProperty = [
    body('title').notEmpty().trim().isLength({ min: 5, max: 255 }),
    body('description').notEmpty().trim().isLength({ min: 20 }),
    body('property_type').isIn(['apartment', 'house', 'villa', 'land', 'commercial']),
    body('transaction_type').isIn(['sale', 'rent']),
    body('price').isNumeric().isFloat({ min: 0 }),
    body('area_sqft').isNumeric().isFloat({ min: 0 }),
    body('bedrooms').optional().isInt({ min: 0 }),
    body('bathrooms').optional().isInt({ min: 0 }),
    body('city').notEmpty().trim(),
    body('location').notEmpty().trim(),
];

export const validateInquiry = [
    body('message').notEmpty().trim().isLength({ min: 10, max: 1000 }),
    body('phone').optional().isMobilePhone('any'),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};