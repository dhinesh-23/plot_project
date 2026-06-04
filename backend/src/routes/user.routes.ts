import { Router } from 'express';

const router = Router();

// Temporary placeholder
router.get('/test', (req, res) => {
    res.json({ message: 'User routes working' });
});

export default router;