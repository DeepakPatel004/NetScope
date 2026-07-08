import app from './app.js'
import config from './config/env.js'
import prisma from './config/database.js'

const StartServer = async ()=>{
    try{
        await prisma.$connect();
        console.log('Database Connected');

        const server = app.listen(config.PORT,()=>{
            console.log('Server running on port ${config.port}');
        })

        const shutdown = async()=>{
            console.log('Shutting down gracefully');
            await prisma.$disconnect();
            server.close();
            process.exit(0);
        }

        process.on('SIGINT',shutdown);
        process.on('SIGTERM',shutdown);
    }
    catch(e){
        console.error('Failed to start server:', error);
    process.exit(1);

    }
};

StartServer();