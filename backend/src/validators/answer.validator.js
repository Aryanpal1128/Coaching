import { z } from 'zod';

export const submitAnswerSchema = z.object({
  body: z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    answerText: z.string().min(5, 'Answer text must be at least 5 characters'),
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
    timeTakenSeconds: z.number().optional()
  })
});
