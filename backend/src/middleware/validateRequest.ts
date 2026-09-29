import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const applicantSchema = z.object({
  applicationId: z.string().min(1, 'applicationId is required'),
  name: z.string().min(1, 'applicant name is required'),
  dob: z.string().optional(),
  qualification: z.string().optional(),
  annualIncome: z.number().optional().or(z.string().transform(v => Number(v))),
  residenceState: z.string().optional()
});

const verificationRequestSchema = z.object({
  service: z.string().min(1, 'service is required'),
  applicant: applicantSchema,
  requestedData: z.array(z.string()).min(1, 'At least one requested data field is required'),
  simulateFailure: z.object({
    department: z.enum(['education', 'revenue', 'residence']).optional(),
    reason: z.string().optional()
  }).optional()
});

export function validateVerificationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verificationRequestSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ error: 'Malformed request body' });
  }
}
