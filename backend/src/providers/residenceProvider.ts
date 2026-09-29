import { ApplicantInfo, ResidenceDepartmentData, MockDepartmentResponse } from '../models/types';

export class ResidenceProvider {
  static readonly departmentName = 'Residence Department';

  /**
   * Verify applicant's residence/domicile against simulated Municipal & Domicile registry
   */
  static async verify(applicant: ApplicantInfo, shouldFail = false): Promise<MockDepartmentResponse<ResidenceDepartmentData>> {
    const verifiedAt = new Date().toISOString();

    if (shouldFail) {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: 'Residence Department verification failed: Domicile record verification timed out.',
        verifiedAt
      };
    }

    const state = applicant.residenceState || 'Telangana';
    const residenceStatus = 'VALID';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        state,
        residenceStatus
      },
      verifiedAt
    };
  }
}
