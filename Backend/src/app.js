import express from 'express';
import cors from 'cors';
import deviceRoutes from './modules/device/device.routes.js'; 
import healthRoutes from './modules/health/health.routes.js'; // 1. Import new routes

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'NetScope API is running' });
});

// 2. Register both route modules
app.use('/api/v1/devices', deviceRoutes); 
app.use('/api/v1/health', healthRoutes); // Register health routes

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;