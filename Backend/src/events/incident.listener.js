import { eventBus } from './eventBus.js';
import { incidentService } from '../modules/incident/incident.service.js';

export const setupIncidentListeners = () => {
  eventBus.on('device_status_changed', async (data) => {
    const { deviceId, currentStatus, errorMsg } = data;

    try {
      if (currentStatus === 'DOWN') {
        await incidentService.openIncident(deviceId, 'DOWNTIME', errorMsg);
      } 
      else if (currentStatus === 'UP') {
        await incidentService.resolveIncident(deviceId, 'DOWNTIME');
      }
    } catch (error) {
      console.error(`[Incident Listener] Failed to process status change for ${deviceId}:`, error);
    }
  });

  console.log('Incident listeners registered (Email disabled).');
};