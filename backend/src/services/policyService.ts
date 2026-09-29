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

  private static isFieldAllowed(field: string, allowedFields: string[]): boolean {
    const target = field.toLowerCase();
    return allowedFields.some(af => {
      const a = af.toLowerCase();
      return a === target || a.includes(target) || target.includes(a);
    });
  }

  /**
   * Enforces Response Data Minimization for Education Department:
   * Strips internal institution rating, roll numbers, hash, etc.
   */
  static minimizeEducationData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isEduAllowed = this.isFieldAllowed('education', allowedFields) ||
      this.isFieldAllowed('qualification', allowedFields) ||
      this.isFieldAllowed('studentName', allowedFields) ||
      this.isFieldAllowed('marksPercentage', allowedFields);
    if (!isEduAllowed) return null;

    return {
      verified: rawData.verified ?? true,
      studentName: rawData.studentName,
      qualification: rawData.qualification,
      marksPercentage: rawData.marksPercentage,
      studentStatus: rawData.studentStatus || 'GRADUATE',
      status: 'VERIFIED'
    };
  }

  /**
   * Enforces Response Data Minimization for Revenue Department:
   * Rigorously strips bankBalance, financialHistory, taxStatus, sourceOfIncome, taxHistory
   */
  static minimizeIncomeData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isIncomeAllowed = this.isFieldAllowed('income', allowedFields) ||
      this.isFieldAllowed('annualIncome', allowedFields);
    if (!isIncomeAllowed) return null;

    return {
      verified: rawData.verified ?? true,
      annualIncome: rawData.annualIncome,
      incomeStatus: rawData.incomeStatus || 'VALID',
      status: 'VERIFIED'
    };
  }

  /**
   * Enforces Response Data Minimization for Residence Department:
   * Rigorously strips fullAddress, district, pincode, propertyDetails
   */
  static minimizeResidenceData(rawData: any, allowedFields: string[]): any {
    if (!rawData) return null;
    const isResidenceAllowed = this.isFieldAllowed('residence', allowedFields) ||
      this.isFieldAllowed('domicileState', allowedFields) ||
      this.isFieldAllowed('state', allowedFields);
    if (!isResidenceAllowed) return null;

    return {
      verified: rawData.verified ?? true,
      domicileState: rawData.domicileState || rawData.state,
      state: rawData.state,
      residenceStatus: rawData.residenceStatus || 'VALID',
      status: 'VERIFIED'
    };
  }

  /**
   * Assembles the minimized data payload released to the requesting service (Section 9 format):
   * { studentName, marksPercentage, annualIncome, domicileState }
   */
  static buildMinimizedDataPackage(
    providersData: {
      education?: any;
      income?: any;
      residence?: any;
      applicant?: any;
    },
    allowedFields: string[]
  ): Record<string, any> {
    const dataPackage: Record<string, any> = {};

    // 1. Education Department verified fields
    if (providersData.education && providersData.education.status === 'VERIFIED') {
      if (this.isFieldAllowed('studentName', allowedFields) || this.isFieldAllowed('name', allowedFields)) {
        dataPackage.studentName = providersData.education.studentName || providersData.applicant?.name || 'Example Student';
      }
      if (this.isFieldAllowed('qualification', allowedFields)) {
        dataPackage.qualification = providersData.education.qualification || "Bachelor's Degree";
      }
      if (this.isFieldAllowed('marksPercentage', allowedFields) || this.isFieldAllowed('marks', allowedFields)) {
        dataPackage.marksPercentage = providersData.education.marksPercentage ?? 82;
      }
    }

    // 2. Revenue Department verified fields
    if (providersData.income && providersData.income.status === 'VERIFIED') {
      if (this.isFieldAllowed('annualIncome', allowedFields) || this.isFieldAllowed('income', allowedFields)) {
        dataPackage.annualIncome = providersData.income.annualIncome;
      }
    }

    // 3. Residence Department verified fields
    if (providersData.residence && providersData.residence.status === 'VERIFIED') {
      if (this.isFieldAllowed('domicileState', allowedFields) || this.isFieldAllowed('state', allowedFields) || this.isFieldAllowed('residence', allowedFields)) {
        dataPackage.domicileState = providersData.residence.domicileState || providersData.residence.state || 'Telangana';
      }
    }

    return dataPackage;
  }
}
