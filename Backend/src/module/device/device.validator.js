import {z} from 'zod'

//Blueprint for creating a new device
const createDeviceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  host: z.string().trim().min(1, 'Host is required'),
  type: z.enum(['WEBSITE', 'API', 'IP'], {
    errorMap: () => ({ message: 'Type must be WEBSITE, API, or IP' }),
  }),
  interval: z.coerce
    .number()
    .int()
    .positive('Interval must be greater than 0')
    .default(1),
});

//Blueprint for updating a device
const updateDeviceSchema = createDeviceSchema.partial();

export const deviceValidator = {
    create : createDeviceSchema,
    update : updateDeviceSchema,
};