import { z } from 'zod';

export const educationResponseContract = z.object({
  verified: z.boolean(),
  studentName: z.string().min(1),
  qualification: z.string().min(1),
  marksPercentage: z.number().min(0).max(100),
  studentStatus: z.string().min(1)
}).passthrough();

export const revenueResponseContract = z.object({
  verified: z.boolean(),
  annualIncome: z.number().min(0),
  incomeStatus: z.string().min(1)
}).passthrough();

export const residenceResponseContract = z.object({
  verified: z.boolean(),
  domicileState: z.string().min(1),
  state: z.string().min(1),
  residenceStatus: z.string().min(1)
}).passthrough();

export class ProviderValidator {
  static validateEducation(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Education provider returned empty or non-object response' };
    }
    const result = educationResponseContract.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        error: `Education provider response failed contract validation: ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { valid: true };
  }

  static validateRevenue(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Revenue provider returned empty or non-object response' };
    }
    const result = revenueResponseContract.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        error: `Revenue provider response failed contract validation: ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { valid: true };
  }

  static validateResidence(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Residence provider returned empty or non-object response' };
    }
    const result = residenceResponseContract.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        error: `Residence provider response failed contract validation: ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { valid: true };
  }
}
