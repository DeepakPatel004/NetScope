import axios from 'axios';

export const httpService ={
    /**
   * Performs an HTTP GET request to check website/API health
   * @param {string} url - The URL to check
   * @returns {Promise<{ status: 'UP' | 'DOWN', latency: number | null, responseCode: number | null }>}
   */

    async check(url)
    {
        const startTime = Date.now();

        try{
            const response = await axios.get(url,{
                timeout : 10000, // 10 seconds max
                validateStatus : false, // dont throw errors for 404/500, we want to log them!
            });

            const latency = Date.now() - startTime;

            const isUp = response.status >= 200 && response.status <400;

            return {
                status : isUp ? 'UP' : 'DOWN',
                latency,
                responseCode : response.status,
            };

        }
        catch(e){
            // If it completely times out or DNS fails, axios throws an error
            return {status : 'DOWN',
            latency : null,
            responseCode : null,
            message :  error.code || 'Connection_Failed'
            }
        }

    }
}