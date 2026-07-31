import { z } from 'zod';

export const scheduleLiveClassSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    subject: z.string().min(1, 'Subject is required'),
    scheduledAt: z.string().optional()
  })
});
