import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import trendRoutes from './routes/trendRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api', predictionRoutes);
app.use('/api', telemetryRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', trendRoutes);
app.use('/api', alertRoutes);

const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => console.log(`Node.js Express Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`Port ${PORT} is reserved by another service (e.g. Laravel Herd / http.sys). Set a different PORT in .env.`);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT in .env.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});