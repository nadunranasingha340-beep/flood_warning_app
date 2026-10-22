import express from 'express';
import { getStations, updateStationThreshold } from '../controllers/stationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getStations);
router.put('/:id/threshold', verifyToken, updateStationThreshold);

export default router;