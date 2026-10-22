import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', verifyToken, getDashboardSummary);

export default router;
