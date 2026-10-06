import express from 'express';
import cors from 'cors';
import deviceRoutes from './modules/device/device.routes.js'; 
import healthRoutes from './modules/health/health.routes.js'; 
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import sslRoutes from './modules/ssl/ssl.routes.js';
import portRoutes from './modules/port/port.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import agentRoutes from './modules/agent/agent.routes.js';
import probeRoutes from './modules/probe/probe.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import recoveryRoutes from './modules/recovery/recovery.routes.js';
import prisma from './config/database.js';
import { requireAuth } from './middleware/auth.middleware.js';

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

app.use('/api/v3/devices', deviceRoutes); 
app.use('/api/v3/health', healthRoutes);
app.use('/api/v3/dashboard', dashboardRoutes);
app.use('/api/v3/ssl', sslRoutes);
app.use('/api/v3/ports', portRoutes);
app.use('/api/v3/reports', reportRoutes);
app.use('/api/v3/analytics', analyticsRoutes);
app.use('/api/v3/auth', authRoutes);
app.use('/api/v3/ai', aiRoutes);
app.use('/api/v3/agent', agentRoutes);
app.use('/api/v3/probes', probeRoutes);
app.use('/api/v3/notifications', notificationRoutes);
app.use('/api/v3/recovery', recoveryRoutes);

app.get('/api/v3/logs', requireAuth, async (req, res, next) => {
  try {
    const include = { user: { select: { username: true, fullName: true } } };
    const [audit, activity] = await Promise.all([
      prisma.auditLog.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100, include }),
      prisma.activityLog.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100, include }),
    ]);
    const data = [...audit, ...activity.map(log => ({ ...log, entityType: log.entity }))].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
