import { ApplicantInfo, MockDepartmentResponse } from '../models/types';

export interface ExtendedRevenueData {
  annualIncome: number;
  incomeStatus: string;
  // Extraneous internal registry data (subject to strict data minimization filtering)
  bankBalance?: number;
  financialHistory?: string;
  taxStatus?: string;
  panCardRef?: string;
}

export class RevenueProvider {
  static readonly departmentName = 'Revenue Department';

  /**
   * Verify applicant's annual income certificate against simulated State Revenue Department registry
   */
  static async verify(
    applicant: ApplicantInfo,
    shouldFail = false
  ): Promise<MockDepartmentResponse<ExtendedRevenueData>> {
    const verifiedAt = new Date().toISOString();

    if (shouldFail) {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: 'Revenue Department verification failed: Income certificate expired or record mismatch.',
        verifiedAt
      };
    }

    const annualIncome = applicant.annualIncome !== undefined ? Number(applicant.annualIncome) : 180000;
    const incomeStatus = 'VALID';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        annualIncome,
        incomeStatus,
        // Sensitive internal revenue attributes that EKSetu policy engine must filter out
        bankBalance: 95000,
        financialHistory: 'Clean - 0 Defaults',
        taxStatus: 'COMPLIANT_FY25',
        panCardRef: 'ABCDE1234F'
      },
      verifiedAt
    };
  }
}
