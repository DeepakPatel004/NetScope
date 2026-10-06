import { Router } from 'express';
const router = Router();
// Explicit retirement response for older consoles and host agents.
router.use((_req, res) => {
  res.status(410).json({ success: false, message: 'Server and container recovery actions have been removed. NetScope provides monitoring and investigation only.' });
});
export default router;
