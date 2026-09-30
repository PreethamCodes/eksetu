import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuditService } from '../services/auditService';

const applicantSchema = z.object({
  applicationId: z.string().min(1, 'applicationId is required'),
  name: z.string().min(1, 'applicant name is required'),
  dob: z.string().optional(),
  qualification: z.string().optional(),
  marksPercentage: z.number().optional().or(z.string().transform(v => Number(v))),
  annualIncome: z.number().optional().or(z.string().transform(v => Number(v))),
  residenceState: z.string().optional()
});

const verificationRequestSchema = z.object({
  service: z.string().min(1, 'service is required'),
  applicant: applicantSchema,
  requestedData: z.array(z.string()).min(1, 'At least one requested data field is required').max(25, 'Cannot exceed 25 requested fields'),
  purpose: z.string().optional(),
  simulateFailure: z.object({
    department: z.enum(['education', 'revenue', 'residence']).optional(),
    failureType: z.enum(['NORMAL', 'FAILURE', 'TIMEOUT', 'MALFORMED_RESPONSE', 'RECORD_NOT_FOUND']).optional(),
    reason: z.string().optional()
  }).optional()
}).passthrough(); // allows client extra fields like allowedFields to be parsed, but ignored by backend

const consentRequestSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
  decision: z.enum(['ALLOW', 'DENY', 'GRANTED', 'DENIED'])
});

export function validateVerificationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verificationRequestSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    const reasons = error instanceof z.ZodError ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`) : ['Malformed JSON payload'];
    AuditService.recordEvent({
      requestId: (req.body?.requestId as string) || 'INVALID_REQ_' + Date.now(),
      eventType: 'INVALID_REQUEST',
      service: (req.body?.service as string) || 'UNKNOWN',
      status: 'FAILED',
      metadata: {
        path: req.originalUrl || req.path,
        reasons
      }
    }).catch(() => {});

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request payload',
        code: 'INVALID_REQUEST',
        message: 'Invalid request payload: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({
      error: 'Malformed request body',
      code: 'INVALID_REQUEST',
      message: 'Malformed JSON payload'
    });
  }
}

export function validateConsentRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = consentRequestSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    const reasons = error instanceof z.ZodError ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`) : ['Malformed JSON payload'];
    AuditService.recordEvent({
      requestId: (req.body?.requestId as string) || 'INVALID_CONSENT_' + Date.now(),
      eventType: 'INVALID_REQUEST',
      service: (req.body?.service as string) || 'UNKNOWN',
      status: 'FAILED',
      metadata: {
        path: req.originalUrl || req.path,
        reasons
      }
    }).catch(() => {});

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid consent payload',
        code: 'INVALID_REQUEST',
        message: 'Invalid consent payload: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      });
    }
    return res.status(400).json({
      error: 'Malformed consent body',
      code: 'INVALID_REQUEST',
      message: 'Malformed JSON payload'
    });
  }
}
