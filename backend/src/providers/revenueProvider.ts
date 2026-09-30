import { ApplicantInfo, FailureSimulationConfig, MockDepartmentResponse } from '../models/types';

export interface ExtendedRevenueData {
  verified: boolean;
  annualIncome: number;
  incomeStatus: string;
  // Extraneous internal registry data (subject to strict data minimization filtering)
  bankBalance?: number;
  financialHistory?: string;
  taxStatus?: string;
  sourceOfIncome?: string;
  taxHistory?: string;
  panCardRef?: string;
}

export class RevenueProvider {
  static readonly departmentName = 'Revenue Department';

  /**
   * Authoritative Revenue Department Registry Simulation:
   * Looks up income certificates and tax records by applicant PAN and reference.
   */
  static async verify(
    applicant: ApplicantInfo,
    simulation?: FailureSimulationConfig | boolean
  ): Promise<MockDepartmentResponse<ExtendedRevenueData>> {
    const verifiedAt = new Date().toISOString();

    const failureType = typeof simulation === 'object' ? (simulation.failureType || 'FAILURE') : (simulation ? 'FAILURE' : 'NORMAL');
    const customReason = typeof simulation === 'object' ? simulation.reason : undefined;

    if (failureType === 'TIMEOUT') {
      const timeoutMs = Number(process.env.PROVIDER_TIMEOUT_MS || 5000);
      await new Promise(resolve => setTimeout(resolve, timeoutMs + 100));
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Revenue Department verification timed out.',
        verifiedAt
      };
    }

    if (failureType === 'RECORD_NOT_FOUND') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Applicant revenue record not found in Revenue Department registry.',
        verifiedAt
      };
    }

    if (failureType === 'FAILURE') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Revenue Department verification failed: Income certificate expired or record mismatch.',
        verifiedAt
      };
    }

    if (failureType === 'MALFORMED_RESPONSE') {
      return {
        department: this.departmentName,
        status: 'VERIFIED',
        data: {
          verified: 'yes' as any,
          annualIncome: 'unknown' as any,
          incomeStatus: 'VALID'
        },
        verifiedAt
      };
    }

    const annualIncome = applicant.annualIncome !== undefined ? Number(applicant.annualIncome) : 180000;
    const incomeStatus = 'VALID';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        verified: true,
        annualIncome,
        incomeStatus,
        // Sensitive internal revenue attributes that EKSetu policy engine must filter out
        bankBalance: 125000,
        financialHistory: 'Clean - 0 Defaults',
        taxStatus: 'ACTIVE',
        sourceOfIncome: 'SALARY',
        taxHistory: 'Filed FY23, FY24, FY25',
        panCardRef: 'ABCDE1234F'
      },
      verifiedAt
    };
  }
}
