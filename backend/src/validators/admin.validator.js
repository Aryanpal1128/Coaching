import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Subject name is required'),
    code: z.string().optional(),
    description: z.string().optional()
  })
});

export const createBadgeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Badge name is required'),
    description: z.string().min(5, 'Description is required'),
    icon: z.string().optional(),
    minReputation: z.number().optional(),
    category: z.enum(['ACHIEVEMENT', 'REPUTATION', 'SPECIAL']).optional()
  })
});
