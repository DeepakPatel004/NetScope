import express from 'express';
import cors from 'cors';
import deviceRoutes from './modules/device/device.routes.js'; 
import healthRoutes from './modules/health/health.routes.js'; 
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import sslRoutes from './modules/ssl/ssl.routes.js';
import portRoutes from './modules/port/port.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';



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

app.use('/api/v1/devices', deviceRoutes); 

app.use('/api/v1/health', healthRoutes);

app.use('/api/v1/dashboard', dashboardRoutes);

app.use('/api/v1/ssl', sslRoutes);

app.use('/api/v1/ports', portRoutes);

app.use('/api/v1/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;