import { Request, Response } from 'express';
import { z } from 'zod';
import { PolicyService } from '../services/policyService';

const policyEvaluateSchema = z.object({
  service: z.string().min(1, 'service is required'),
  purpose: z.string().default('SCHOLARSHIP_ELIGIBILITY'),
  requestedFields: z.array(z.string()).min(1, 'At least one requested field is required')
});

export class PolicyController {
  /**
   * Policy Evaluation Endpoint (V3 Data Minimization Inspection)
   * POST /api/v1/policy/evaluate
   */
  static async evaluate(req: Request, res: Response) {
    try {
      const parsed = policyEvaluateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'INVALID_REQUEST',
          details: parsed.error.errors.map(e => e.message)
        });
      }

      const { service, purpose, requestedFields } = parsed.data;
      const result = PolicyService.evaluatePolicy(service, purpose, requestedFields);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: 'POLICY_EVALUATION_ERROR',
        message: error.message || 'Failed to evaluate policy'
      });
    }
  }
}
