import express from 'express';
import { getTrends } from '../controllers/trendController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/trends', verifyToken, getTrends);

export default router;
