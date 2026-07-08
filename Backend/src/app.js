import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())

app.use(express.json())

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/',(req,res)=>{
    res.json({message:"Hello from backend"})
})

app.use((err,req,res,next)=>{
    console.error(err.stack)
    res.status(500).json({
        success : false,
        message : err.message || 'Internal Server Error',
    })
})

export default app