import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateInquiry, handleValidationErrors } from '../middleware/validation';
import { createInquiry, getUserInquiries, getPropertyInquiries } from '../controllers/inquiryController';

const router = Router();

router.post('/', authenticateToken, validateInquiry, handleValidationErrors, createInquiry);
router.get('/my-inquiries', authenticateToken, getUserInquiries);
router.get('/property/:property_id', authenticateToken, getPropertyInquiries);

export default router;