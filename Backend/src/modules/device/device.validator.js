import { z } from 'zod';

const createDeviceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  host: z.string().trim().min(1, 'Host is required'),
  type: z.enum(['WEBSITE', 'API', 'IP', 'SERVER', 'WORKER'], {
    errorMap: () => ({ message: 'Type must be WEBSITE, API, IP, SERVER, or WORKER' }),
  }),
  interval: z.coerce
    .number()
    .int()
    .positive('Interval must be greater than 0')
    .default(30),
  enabled: z.boolean().optional(),
});

const updateDeviceSchema = createDeviceSchema.partial();

export const deviceValidator = {
  create: createDeviceSchema,
  update: updateDeviceSchema,
};