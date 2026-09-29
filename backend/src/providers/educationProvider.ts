import { ApplicantInfo, MockDepartmentResponse } from '../models/types';

export interface ExtendedEducationData {
  verified: boolean;
  studentName: string;
  qualification: string;
  marksPercentage: number;
  studentStatus: string;
  // Extraneous internal registry data (subject to data minimization filtering)
  institution?: string;
  enrollmentYear?: number;
  cgpa?: number;
  degreeCertificateHash?: string;
}

export class EducationProvider {
  static readonly departmentName = 'Education Department';

  /**
   * Authoritative Education Department Registry Simulation:
   * Looks up academic records by student name and application reference.
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

    const studentName = applicant.name || 'Sai Preetham';
    const qualification = applicant.qualification || "Bachelor's Degree";
    const marksPercentage = applicant.marksPercentage || 82;
    const studentStatus = 'GRADUATE';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        verified: true,
        studentName,
        qualification,
        marksPercentage,
        studentStatus,
        // Internal registry details that EKSetu policy engine filters out
        institution: 'National University of Technology',
        enrollmentYear: 2021,
        cgpa: 8.85,
        degreeCertificateHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      verifiedAt
    };
  }
}
