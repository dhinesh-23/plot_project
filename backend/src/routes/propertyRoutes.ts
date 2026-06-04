import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateProperty, handleValidationErrors } from '../middleware/validation';
import {
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    getSimilarProperties
} from '../controllers/propertyController';

const router = Router();

router.post('/', authenticateToken, validateProperty, handleValidationErrors, createProperty);
router.get('/', getProperties);
router.get('/similar/:id', getSimilarProperties);
router.get('/:id', getPropertyById);
router.put('/:id', authenticateToken, updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);

export default router;