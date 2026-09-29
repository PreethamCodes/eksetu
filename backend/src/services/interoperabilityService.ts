import {
  AggregatedVerificationResult,
  DepartmentSourceSummary,
  TraceStep,
  VerificationRequestInput,
  VerificationStatus
} from '../models/types';
import { generateRequestId } from '../utils/requestIdGenerator';
import { EducationProvider } from '../providers/educationProvider';
import { RevenueProvider } from '../providers/revenueProvider';
import { ResidenceProvider } from '../providers/residenceProvider';
import { DatabaseService } from './databaseService';

export class InteroperabilityService {
  /**
   * Orchestrates the complete EKSetu Verification Lifecycle:
   * 1. Generates Request ID
   * 2. Saves initial record
   * 3. Discovers & calls required department providers
   * 4. Validates each department response
   * 5. Aggregates data & builds request trace
   * 6. Persists completed record to Supabase
   */
  static async processVerificationRequest(
    payload: VerificationRequestInput
  ): Promise<AggregatedVerificationResult> {
    const requestId = generateRequestId();
    const trace: TraceStep[] = [];
    const sources: DepartmentSourceSummary[] = [];
    const timestamp = new Date().toISOString();

    // 1. Trace: Request Created
    trace.push({
      step: 'REQUEST_CREATED',
      message: `Verification request initiated with ID ${requestId} for service ${payload.service}`,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    // Save initial state
    await DatabaseService.createRequestRecord(requestId, payload.service, payload);

    // Prepare simulated failure checks
    const failDept = payload.simulateFailure?.department;

    const requestedData = payload.requestedData || ['education', 'income', 'residence'];
    const verifiedData: AggregatedVerificationResult['verifiedData'] = {};

    // 2. Contact Education Provider if requested
    if (requestedData.includes('education')) {
      const shouldFail = failDept === 'education';
      const eduRes = await EducationProvider.verify(payload.applicant, shouldFail);

      sources.push({
        department: eduRes.department,
        status: eduRes.status,
        verifiedAt: eduRes.verifiedAt,
        error: eduRes.error
      });

      if (eduRes.status === 'VERIFIED' && eduRes.data) {
        verifiedData.education = {
          qualification: eduRes.data.qualification,
          studentStatus: eduRes.data.studentStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'EDUCATION_DEPARTMENT_VERIFIED',
          message: 'Education Department API contacted — Academic qualification verified',
          status: 'SUCCESS',
          timestamp: eduRes.verifiedAt
        });
      } else {
        verifiedData.education = {
          qualification: payload.applicant.qualification || 'Unverified',
          status: 'FAILED'
        };
        trace.push({
          step: 'EDUCATION_DEPARTMENT_FAILED',
          message: `Education Department API returned error: ${eduRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: eduRes.verifiedAt
        });
      }
    }

    // 3. Contact Revenue Provider if requested
    if (requestedData.includes('income')) {
      const shouldFail = failDept === 'revenue';
      const revRes = await RevenueProvider.verify(payload.applicant, shouldFail);

      sources.push({
        department: revRes.department,
        status: revRes.status,
        verifiedAt: revRes.verifiedAt,
        error: revRes.error
      });

      if (revRes.status === 'VERIFIED' && revRes.data) {
        verifiedData.income = {
          annualIncome: revRes.data.annualIncome,
          incomeStatus: revRes.data.incomeStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'REVENUE_DEPARTMENT_VERIFIED',
          message: 'Revenue Department API contacted — Annual income validated',
          status: 'SUCCESS',
          timestamp: revRes.verifiedAt
        });
      } else {
        verifiedData.income = {
          annualIncome: payload.applicant.annualIncome || 0,
          status: 'FAILED'
        };
        trace.push({
          step: 'REVENUE_DEPARTMENT_FAILED',
          message: `Revenue Department API returned error: ${revRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: revRes.verifiedAt
        });
      }
    }

    // 4. Contact Residence Provider if requested
    if (requestedData.includes('residence')) {
      const shouldFail = failDept === 'residence';
      const resRes = await ResidenceProvider.verify(payload.applicant, shouldFail);

      sources.push({
        department: resRes.department,
        status: resRes.status,
        verifiedAt: resRes.verifiedAt,
        error: resRes.error
      });

      if (resRes.status === 'VERIFIED' && resRes.data) {
        verifiedData.residence = {
          state: resRes.data.state,
          residenceStatus: resRes.data.residenceStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'RESIDENCE_DEPARTMENT_VERIFIED',
          message: 'Residence Department API contacted — State domicile validated',
          status: 'SUCCESS',
          timestamp: resRes.verifiedAt
        });
      } else {
        verifiedData.residence = {
          state: payload.applicant.residenceState || 'Unknown',
          status: 'FAILED'
        };
        trace.push({
          step: 'RESIDENCE_DEPARTMENT_FAILED',
          message: `Residence Department API returned error: ${resRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: resRes.verifiedAt
        });
      }
    }

    // 5. Compute overall verification status
    const totalSources = sources.length;
    const verifiedSourcesCount = sources.filter(s => s.status === 'VERIFIED').length;

    let overallStatus: VerificationStatus = 'VERIFIED';
    if (verifiedSourcesCount === 0) {
      overallStatus = 'FAILED';
    } else if (verifiedSourcesCount < totalSources) {
      overallStatus = 'PARTIAL_VERIFIED';
    }

    // 6. Trace: Data Aggregation & Finalization
    trace.push({
      step: 'DATA_AGGREGATED',
      message: `Aggregated data from ${totalSources} department sources (${verifiedSourcesCount}/${totalSources} verified)`,
      status: overallStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    trace.push({
      step: 'VERIFICATION_COMPLETE',
      message: `EKSetu interoperability orchestration complete. Status: ${overallStatus}`,
      status: overallStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    const result: AggregatedVerificationResult = {
      requestId,
      service: payload.service,
      status: overallStatus,
      applicant: payload.applicant,
      verifiedData,
      sources,
      trace,
      timestamp
    };

    // 7. Persist completed record
    await DatabaseService.completeRequestRecord(requestId, result);

    return result;
  }
}
