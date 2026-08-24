import { Router } from 'express';
import { agentController } from './agent.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public agent heartbeat ingestion endpoint (auth via X-NetScope-Agent-Key)
router.post('/heartbeat', agentController.ingestHeartbeat);

// Protected user management endpoints
router.post('/register', authenticate, agentController.registerAgent);
router.get('/metrics/:deviceId', authenticate, agentController.getAgentMetrics);
router.get('/discovered-services/:deviceId', authenticate, agentController.getDiscoveredServices);
router.put('/primary-service/:deviceId', authenticate, agentController.setPrimaryService);

export default router;
