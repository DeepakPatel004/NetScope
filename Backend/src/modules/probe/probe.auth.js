import crypto from 'crypto';
import prisma from '../../config/database.js';

/**
 * Computes SHA-256 hash of a probe secret token.
 */
export function hashProbeToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Generates a new cryptographically secure probe token.
 */
export function generateProbeToken() {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `nsp_probe_${crypto.randomUUID()}_${randomHex}`;
}

/**
 * Express middleware to authenticate probe requests via Bearer token.
 */
export async function requireProbeAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header. Expected Bearer <probeToken>.',
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Empty probe token provided.',
      });
    }

    const tokenHash = hashProbeToken(token);

    const probe = await prisma.probe.findUnique({
      where: { tokenHash },
    });

    if (!probe) {
      return res.status(401).json({
        success: false,
        message: 'Invalid probe credentials.',
      });
    }

    if (probe.isRevoked || probe.status === 'REVOKED') {
      return res.status(403).json({
        success: false,
        message: 'Probe credentials have been revoked.',
      });
    }

    // Attach authenticated probe to request context
    req.probe = probe;
    next();
  } catch (error) {
    console.error('[ProbeAuth] Error verifying probe credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error authenticating probe.',
    });
  }
}
