import Redis from 'ioredis'
import config from './env.js'

const redisConnection = new Redis(config.REDIS_URL,{
    maxRetriesPerRequest : null, //required bt BullMQ
    enableReadyCheck : false,
});

redisConnection.on('connect', ()=>{
    console.log('Redis Connected')
});

redisConnection.on('error',(error)=>{
    console.log('Redis connection error : ',error);
})

export default redisConnection;