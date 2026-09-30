import { ApplicantInfo, FailureSimulationConfig, MockDepartmentResponse } from '../models/types';
import { findSimulatedCitizen } from './simulatedCitizens';

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
    simulation?: FailureSimulationConfig | boolean
  ): Promise<MockDepartmentResponse<ExtendedEducationData>> {
    const verifiedAt = new Date().toISOString();

    const failureType = typeof simulation === 'object' ? (simulation.failureType || 'FAILURE') : (simulation ? 'FAILURE' : 'NORMAL');
    const customReason = typeof simulation === 'object' ? simulation.reason : undefined;

    if (failureType === 'TIMEOUT') {
      const timeoutMs = Number(process.env.PROVIDER_TIMEOUT_MS || 5000);
      await new Promise(resolve => setTimeout(resolve, timeoutMs + 100));
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Education Department registry gateway timed out after waiting for response.',
        verifiedAt
      };
    }

    if (failureType === 'RECORD_NOT_FOUND') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Applicant academic record not found in Education Department database.',
        verifiedAt
      };
    }

    if (failureType === 'FAILURE') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Candidate academic record not found or unverified in Education Department database.',
        verifiedAt
      };
    }

    if (failureType === 'MALFORMED_RESPONSE') {
      return {
        department: this.departmentName,
        status: 'VERIFIED',
        data: {
          verified: 'yes' as any,
          studentName: applicant.name || 'Sai Preetham',
          qualification: applicant.qualification || "Bachelor's Degree",
          marksPercentage: 'eighty-two' as any,
          studentStatus: 'GRADUATE'
        },
        verifiedAt
      };
    }

    const citizen = findSimulatedCitizen(applicant.applicationId, applicant.name);
    if (citizen) {
      if (citizen.educationStatus === 'RECORD_NOT_FOUND') {
        return {
          department: this.departmentName,
          status: 'FAILED',
          error: 'Applicant academic record not found in Education Department database.',
          verifiedAt
        };
      }
    }

    const studentName = applicant.name || (citizen?.name ?? 'Sai Preetham');
    const qualification = applicant.qualification || (citizen?.qualification ?? "Bachelor's Degree");
    const marksPercentage = applicant.marksPercentage || (citizen?.marksPercentage ?? 82);
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
