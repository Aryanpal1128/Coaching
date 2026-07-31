import { z } from 'zod';

export const createQuestionSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    images: z.array(z.string()).optional(),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          fileType: z.string().optional()
        })
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    subject: z.string().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional()
  })
});
