import { z } from 'zod';

const fields = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  host: z.string().trim().url().refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  }, 'Use an HTTP/HTTPS URL without embedded credentials'),
  type: z.enum(['WEBSITE', 'API']),
  interval: z.coerce.number().int().min(5).max(86400),
  timeoutMs: z.coerce.number().int().min(1000).max(30000),
  selectedProbes: z.array(z.string().trim().min(1)).max(100),
  enabled: z.boolean().optional(),
});

export const deviceValidator = {
  create: fields.extend({
    interval: fields.shape.interval.default(30),
    timeoutMs: fields.shape.timeoutMs.default(10000),
    selectedProbes: fields.shape.selectedProbes.default([]),
  }),
  update: fields.partial(),
};
