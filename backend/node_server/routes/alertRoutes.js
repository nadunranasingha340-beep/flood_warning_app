import express from 'express';
import {
  sendWarningEmail,
  getStationEmails,
  updateStationEmail,
  sendDailyReports,
  getEmailLogs,
  getTodayEmailStatus,
  clearEmailLogs,
} from '../controllers/alertController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-alert', verifyToken, sendWarningEmail);
router.get('/station-emails', verifyToken, getStationEmails);
router.put('/station-emails/:station_id', verifyToken, updateStationEmail);
router.post('/send-daily-reports', verifyToken, sendDailyReports);
router.get('/email-logs', verifyToken, getEmailLogs);
router.delete('/email-logs', verifyToken, clearEmailLogs);
router.get('/email-status', verifyToken, getTodayEmailStatus);

export default router;