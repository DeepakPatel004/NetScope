import { pingSevices } from "./ping.service.js";
import { httpService } from "./http.service.js";

export const monitorService = {
    /**
   * Routes the check to the correct service based on device type
   * @param {string} type - 'WEBSITE', 'API', or 'IP'
   * @param {string} host - The target to check
   */

    async checkDevice(type,host){
        switch(type){
            case 'IP':
                return pingSevice.check(host);
            
            case 'WEBSITE':
            case 'API':
                const formattedHost = host.startsWith('http') ? host : `https://${host}`;
                return httpService.check(formattedHost);
            
            default:
                 throw new Error(`Unsupported device type : ${type}`);
        }
    
    }

}