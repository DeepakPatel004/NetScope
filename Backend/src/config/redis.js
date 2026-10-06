import Redis from 'ioredis'
import config from './env.js'

const isTest = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));

const redisConnection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: isTest,
    retryStrategy: (times) => {
        if (isTest || times > 5) return null;
        return Math.min(times * 200, 2000);
    },
});

redisConnection.on('connect', ()=>{
    console.log('Redis Connected')
});

redisConnection.on('error',(error)=>{
    console.log('Redis connection error : ',error);
})

export default redisConnection;