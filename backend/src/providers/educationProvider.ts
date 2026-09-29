import { ApplicantInfo, EducationDepartmentData, MockDepartmentResponse } from '../models/types';

export class EducationProvider {
  static readonly departmentName = 'Education Department';

  /**
   * Verify applicant's education qualification against simulated Department of Higher Education registry
   */
  static async verify(applicant: ApplicantInfo, shouldFail = false): Promise<MockDepartmentResponse<EducationDepartmentData>> {
    const verifiedAt = new Date().toISOString();

    if (shouldFail) {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: 'Candidate academic record not found or unverified in Education Department database.',
        verifiedAt
      };
    }

    // Realistic mock verification logic
    const qualification = applicant.qualification || "Bachelor's Degree";
    const studentStatus = 'GRADUATE';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        qualification,
        studentStatus
      },
      verifiedAt
    };
  }
}
