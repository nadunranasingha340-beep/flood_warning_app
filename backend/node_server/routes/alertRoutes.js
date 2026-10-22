import express from 'express';
import { sendWarningEmail } from '../controllers/alertController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-alert', verifyToken, sendWarningEmail);

export default router;