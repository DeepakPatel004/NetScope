import tls from 'tls';
import prisma from '../../config/database.js';
import { PrismaClient } from '@prisma/client';

export const sslService = {
  /**
   * Connects to a host and extracts its SSL certificate
   */
  async fetchCertificate(host) {
    return new Promise((resolve, reject) => {
      // Strip http:// or https:// if present, and remove any paths
      const cleanHost = host
        .replace(/^(https?:\/\/)/, '') // Strip protocol
        .split(/[/?#\]]/)[0]           // Split at /, ?, #, or markdown closing bracket ]
        .trim();

      const options = {
        host: cleanHost,
        port: 443,
        servername: cleanHost, // Required for SNI (Server Name Indication)
        rejectUnauthorized: false, // We want to fetch the cert even if it's expired/invalid so we can log it
      };

      const socket = tls.connect(options, () => {
        const cert = socket.getPeerCertificate(true);

        // We got what we needed, close the connection immediately
        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          return reject(new Error('No certificate found on this host'));
        }

        // Extract and calculate dates
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();

        const timeDiff = validTo.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Determine the business logic status
        let status = 'VALID';
        if (daysRemaining <= 0) {
          status = 'EXPIRED';
        } else if (daysRemaining <= 30) {
          status = 'EXPIRING';
        }

        // If the certificate authority is untrusted or self-signed
        if (socket.authorized === false && status !== 'EXPIRED') {
          status = 'INVALID';
        }

        // Return perfectly mapped data for our Prisma schema
        resolve({
          issuer: cert.issuer.O || cert.issuer.CN || 'Unknown Issuer',
          subject: cert.subject.CN || cleanHost,
          validFrom,
          validTo,
          daysRemaining,
          serialNumber: cert.serialNumber,
          fingerprint: cert.fingerprint256,
          status
        });
      });

      socket.on('error', (err) => {
        reject(err);
      });

      // Don't let it hang forever
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('TLS Connection Timeout'));
      });
    });
  },

  /**
   * Appends the check result into the historical SSLStatus table
   */
  async saveSSLStatus(deviceId, sslData) {
    // Prisma usually lowercases the first letter of the model name
    return await prisma.sSLStatus.create({
      data: {
        deviceId,
        ...sslData
      }
    });
  }
};