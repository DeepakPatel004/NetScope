import net from 'net';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A standard list of critical ports to monitor across servers
const COMMON_PORTS = [
  21,   // FTP
  22,   // SSH
  25,   // SMTP
  53,   // DNS
  80,   // HTTP
  110,  // POP3
  143,  // IMAP
  443,  // HTTPS
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  27017 // MongoDB
];

export const portService = {
  /**
   * Checks a single port by attempting a TCP handshake
   */
  checkPort(host, port, timeoutMs = 2000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = 'closed';

      // 1. Connection Success
      socket.on('connect', () => {
        status = 'open';
        socket.destroy(); // Destroy immediately, we only care about the handshake
      });

      // 2. Connection Timeout (Firewall dropped it)
      socket.setTimeout(timeoutMs);
      socket.on('timeout', () => {
        socket.destroy();
      });

      // 3. Connection Refused (Port is explicitly closed)
      socket.on('error', () => {
        socket.destroy();
      });

      // 4. Cleanup and Resolve
      socket.on('close', () => {
        resolve({ port, status });
      });

      // Clean the host string (remove http:// or paths if present)
      const cleanHost = host.replace(/^(https?:\/\/)/, '').split('/')[0];

      // Initiate the TCP handshake
      socket.connect(port, cleanHost);
    });
  },

  /**
   * Scans multiple ports concurrently and returns an array of open ports
   */
  async scanHost(host, ports = COMMON_PORTS) {
    // Promise.all runs all port checks simultaneously instead of one by one
    const results = await Promise.all(
      ports.map(port => this.checkPort(host, port))
    );
    
    // Filter the results down to just an array of the open port numbers
    const openPorts = results
      .filter(result => result.status === 'open')
      .map(result => result.port);
      
    return openPorts;
  },

  /**
   * Appends the scan result to the database
   */
  async saveScanResult(deviceId, openPorts) {
    return await prisma.portScanLog.create({
      data: {
        deviceId,
        openPorts,
      }
    });
  }
};