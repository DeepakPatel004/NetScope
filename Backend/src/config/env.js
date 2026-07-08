import path from 'path'
import dotenv from 'dotenv'
import {z} from 'zod'

dotenv.config({path : path.resolve(import.meta.dirname, '../../.env')})

const evSchema = z.object( {
    PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().trim().min(1),
  REDIS_URL: z.string().trim().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

const env = evSchema.parse(process.env)

const config = {
    PORT : env.PORT,
    DATABASE_URL : env.DATABASE_URL,
    REDIS_URL : env.REDIS_URL,
    NODE_ENV : env.NODE_ENV
}

export default config