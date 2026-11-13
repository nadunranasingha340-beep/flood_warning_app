import express from 'express';
import { makePrediction, explainPrediction, getPredictionsComparison, getExplainabilityData } from '../controllers/predictionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/predict-station', verifyToken, makePrediction);
router.get('/predictions-comparison', verifyToken, getPredictionsComparison);
router.post('/explain-station', verifyToken, explainPrediction);
router.get('/explainability', verifyToken, getExplainabilityData);

export default router;