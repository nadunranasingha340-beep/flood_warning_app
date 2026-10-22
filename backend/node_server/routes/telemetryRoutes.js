import express from 'express';
import { submitDailyTelemetry } from '../controllers/telemetryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/telemetry', verifyToken, submitDailyTelemetry);

export default router;
