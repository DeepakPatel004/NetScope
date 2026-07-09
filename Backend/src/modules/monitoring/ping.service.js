import ping from 'ping'
import { hostname } from 'zod'

export const pingSevices = {
    /**
   * Pings an IP address or hostname
   * @param {string} host - The IP or domain to check
   * @returns {Promise<{ status: 'UP' | 'DOWN', latency: number | null }>}
   */

    async check(host){
        try{
            const response = await ping.promise.probe(host,{
                timeout : 10,
            });

            return {
                status : response.alive ? 'UP' : 'DOWN',
                latency : response.alive ? Math.round(response.time) : null,
            };
        }
        catch (e) {
      console.error(`[PingService] Failed to check ${host}:`, e.message);
      return { status: 'DOWN', latency: null };
    }
    }

}