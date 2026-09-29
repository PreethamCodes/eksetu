import { ApplicantInfo, MockDepartmentResponse } from '../models/types';

export interface ExtendedEducationData {
  qualification: string;
  studentStatus: string;
  // Extraneous internal registry data (subject to data minimization filtering)
  institution?: string;
  cgpa?: number;
  degreeCertificateHash?: string;
}

export class EducationProvider {
  static readonly departmentName = 'Education Department';

  /**
   * Verify applicant's education qualification against simulated Department of Higher Education registry
   */
  static async verify(
    applicant: ApplicantInfo,
    shouldFail = false
  ): Promise<MockDepartmentResponse<ExtendedEducationData>> {
    const verifiedAt = new Date().toISOString();

    if (shouldFail) {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: 'Candidate academic record not found or unverified in Education Department database.',
        verifiedAt
      };
    }

    const qualification = applicant.qualification || "Bachelor's Degree";
    const studentStatus = 'GRADUATE';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        qualification,
        studentStatus,
        // Internal registry details that EKSetu policy engine must filter out
        institution: 'National University of Technology',
        cgpa: 8.85,
        degreeCertificateHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      verifiedAt
    };
  }
}
