import { ApplicantInfo, FailureSimulationConfig, MockDepartmentResponse } from '../models/types';
import { findSimulatedCitizen } from './simulatedCitizens';

export interface ExtendedResidenceData {
  verified: boolean;
  domicileState: string;
  state: string;
  residenceStatus: string;
  // Extraneous internal registry data (subject to strict data minimization filtering)
  district?: string;
  fullAddress?: string;
  pincode?: string;
  propertyDetails?: string;
}

export class ResidenceProvider {
  static readonly departmentName = 'Residence Department';

  /**
   * Authoritative Municipal & Domicile Registry Simulation:
   * Looks up state residence and domicile certificates.
   */
  static async verify(
    applicant: ApplicantInfo,
    simulation?: FailureSimulationConfig | boolean
  ): Promise<MockDepartmentResponse<ExtendedResidenceData>> {
    const verifiedAt = new Date().toISOString();

    const failureType = typeof simulation === 'object' ? (simulation.failureType || 'FAILURE') : (simulation ? 'FAILURE' : 'NORMAL');
    const customReason = typeof simulation === 'object' ? simulation.reason : undefined;

    if (failureType === 'TIMEOUT') {
      const timeoutMs = Number(process.env.PROVIDER_TIMEOUT_MS || 5000);
      await new Promise(resolve => setTimeout(resolve, timeoutMs + 100));
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Residence Department verification failed: Domicile record verification timed out.',
        verifiedAt
      };
    }

    if (failureType === 'RECORD_NOT_FOUND') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Applicant residence record not found in Municipal registry.',
        verifiedAt
      };
    }

    if (failureType === 'FAILURE') {
      return {
        department: this.departmentName,
        status: 'FAILED',
        error: customReason || 'Residence Department verification failed: Domicile record verification timed out.',
        verifiedAt
      };
    }

    if (failureType === 'MALFORMED_RESPONSE') {
      return {
        department: this.departmentName,
        status: 'VERIFIED',
        data: {
          verified: 'yes' as any,
          domicileState: 12345 as any,
          state: 12345 as any,
          residenceStatus: 'VALID'
        },
        verifiedAt
      };
    }

    const citizen = findSimulatedCitizen(applicant.applicationId, applicant.name);
    if (citizen) {
      if (citizen.residenceStatus === 'MISMATCH') {
        return {
          department: this.departmentName,
          status: 'FAILED',
          error: 'Residence Department verification failed: Domicile record mismatch.',
          verifiedAt
        };
      }
      if (applicant.residenceState && applicant.residenceState !== citizen.officialState) {
        return {
          department: this.departmentName,
          status: 'FAILED',
          error: `Residence Department verification failed: Declared state (${applicant.residenceState}) does not match official domicile registry record (${citizen.officialState}).`,
          verifiedAt
        };
      }
    }

    const state = applicant.residenceState || (citizen?.officialState ?? 'Telangana');
    const residenceStatus = 'VALID';

    return {
      department: this.departmentName,
      status: 'VERIFIED',
      data: {
        verified: true,
        domicileState: state,
        state,
        residenceStatus,
        // Detailed PII and property records that EKSetu policy engine must filter out
        district: 'Hyderabad',
        fullAddress: 'Flat 402, Green Meadows, Madhapur, Hyderabad, Telangana 500081',
        pincode: '500081',
        propertyDetails: 'Residential Ownership'
      },
      verifiedAt
    };
  }
}
