import { PolicyEngine } from '../policies/policyEngine';
import { PolicyEvaluationResult } from '../policies/policyTypes';

export class PolicyService {
  /**
   * Evaluates request against purpose-bound policies
   */
  static evaluatePolicy(
    service: string,
    purpose: string,
    requestedFields: string[]
  ): PolicyEvaluationResult {
    return PolicyEngine.evaluate(service, purpose, requestedFields);
  }

  /**
   * Enforces Response Data Minimization:
   * Strips any unapproved, extraneous, or sensitive fields returned by underlying providers
   * before the payload is returned to the requesting service.
   */
  static minimizeEducationData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isEduAllowed = allowedFields.some(f => f.includes('education'));
    if (!isEduAllowed) return null;

    // Only allow qualification and studentStatus; strip internal institution rating, roll numbers, etc.
    return {
      qualification: rawData.qualification,
      studentStatus: rawData.studentStatus || 'GRADUATE',
      status: rawData.status || 'VERIFIED'
    };
  }

  static minimizeIncomeData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isIncomeAllowed = allowedFields.some(f => f.includes('income'));
    if (!isIncomeAllowed) return null;

    // Only allow annualIncome and incomeStatus; rigorously strip bankBalance, financialHistory, taxStatus
    return {
      annualIncome: rawData.annualIncome,
      incomeStatus: rawData.incomeStatus || 'VALID',
      status: rawData.status || 'VERIFIED'
    };
  }

  static minimizeResidenceData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isResidenceAllowed = allowedFields.some(f => f.includes('residence'));
    if (!isResidenceAllowed) return null;

    // Only allow state and residenceStatus; strip fullAddress, propertyDetails, district
    return {
      state: rawData.state,
      residenceStatus: rawData.residenceStatus || 'VALID',
      status: rawData.status || 'VERIFIED'
    };
  }
}
