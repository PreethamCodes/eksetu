import { ApplicantInfo, RevenueDepartmentData, MockDepartmentResponse } from '../models/types';

export class RevenueProvider {
  static readonly departmentName = 'Revenue Department';

  /**
   * Verify applicant's annual income certificate against simulated State Revenue Department registry
   */
  static async verify(applicant: ApplicantInfo, shouldFail = false): Promise<MockDepartmentResponse<RevenueDepartmentData>> {
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
        incomeStatus
      },
      verifiedAt
    };
  }
}
