import cron from 'node-cron';
import prisma from '../config/database.js'
import { healthQueue,QUEUE_NAMES } from '../config/queue.js';

export const startScheduler = ()=>{
    cron.schedule('* * * * *',async()=>{
        console.log(`[${new Date().toISOString()}] [Scheduler] Waking up...`);

        try{
            const devices = await prisma.device.findMany({
                where : {enabled : true},
            });

            if(devices.length===0){
                console.log('[Scheduler] No active devices to monitor.');
        return;
            }

            const jobs = devices.map((devices)=>({
                name : QUEUE_NAMES.HEALTH_CHECK,
                data : {
                    deviceId : device.id,
                    host : device.host,
                    type : device.type,
                },
            }));

            await healthQueue.addBulk(jobs);

            console.log(`[Scheduler] Added ${jobs.length} jobs to the queue `);

        }
        catch(e){
            console.log('[Scheduler] Failed to queue jobs ',e)
        }
    });

    console.log('Scheduler worker initialized');
}