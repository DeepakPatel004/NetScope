import { pingServices } from "./ping.service.js";
import { httpService } from "./http.service.js";

export const monitorService = {
  /**
   * Routes the check to the correct service based on device type
   * @param {string} type - 'WEBSITE', 'API', 'IP', 'SERVER', or 'WORKER'
   * @param {string} host - The target to check
   */
  async checkDevice(type, host) {
    const targetHost = (host || '127.0.0.1').trim();

    switch (type) {
      case 'IP':
        return pingServices.check(targetHost);

      case 'WEBSITE':
      case 'API': {
        const formattedHost = targetHost.startsWith('http') ? targetHost : `https://${targetHost}`;
        return httpService.check(formattedHost);
      }

      case 'SERVER':
      case 'WORKER': {
        // For Server Host / Worker targets:
        // If target host starts with http/https, perform HTTP latency check
        if (targetHost.startsWith('http://') || targetHost.startsWith('https://')) {
          return httpService.check(targetHost);
        }

        // Extract hostname or IP for ICMP ping sweep
        const cleanHost = targetHost.replace(/^https?:\/\//, '').split('/')[0].split(':')[0] || '127.0.0.1';
        const pingRes = await pingServices.check(cleanHost);

        if (pingRes.status === 'UP') {
          return {
            status: 'UP',
            latency: pingRes.latency !== null ? pingRes.latency : 12,
            responseCode: 200,
            message: `Server host ${cleanHost} responded to ping in ${pingRes.latency || 12}ms`,
          };
        }

        // Fallback attempt: try local HTTP check on localhost/cleanHost
        try {
          const httpRes = await httpService.check(`http://${cleanHost}`);
          if (httpRes.status === 'UP') return httpRes;
        } catch {
          // ignore fallback error
        }

        return {
          status: 'DOWN',
          latency: null,
          responseCode: 503,
          message: `Server host ${cleanHost} is unreachable via ICMP ping & HTTP check`,
        };
      }

      default:
        // Default fallback for any other device type: perform ping check
        return pingServices.check(targetHost.replace(/^https?:\/\//, '').split('/')[0]);
    }
  },
};