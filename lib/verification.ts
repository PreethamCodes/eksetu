import { getServiceRequest, updateRequestVerified } from './requestStore';
import { defaultDataProvider } from './dataProvider';
import { VerificationResponse } from './types';

export interface VerificationResultOutcome {
  success: boolean;
  statusCode: number;
  response?: VerificationResponse;
  errorMessage?: string;
  errorCode?: string;
}

export async function processVerification(requestId: string): Promise<VerificationResultOutcome> {
  // 1. Confirm request exists
  const req = getServiceRequest(requestId);
  if (!req) {
    return {
      success: false,
      statusCode: 404,
      errorMessage: 'Service request not found or expired',
      errorCode: 'REQUEST_NOT_FOUND',
    };
  }

  // 2. Confirm consent was granted
  if (req.consent !== 'GRANTED') {
    return {
      success: false,
      statusCode: 403,
      errorMessage: 'Citizen consent has not been granted for this request',
      errorCode: 'CONSENT_REQUIRED',
    };
  }

  // 3. Request information from the mock provider
  const providerData = await defaultDataProvider.getIncomeData(req.citizenId);
  if (!providerData) {
    return {
      success: false,
      statusCode: 502,
      errorMessage: 'Connected government data provider could not find citizen record',
      errorCode: 'PROVIDER_DATA_UNAVAILABLE',
    };
  }

  // 4. Validate provider response
  if (!providerData.verified || typeof providerData.annualIncome !== 'number') {
    return {
      success: false,
      statusCode: 502,
      errorMessage: 'Invalid or unverified response received from data provider',
      errorCode: 'INVALID_PROVIDER_PAYLOAD',
    };
  }

  // 5. Mark data as verified in the request store
  const verifiedRecord = {
    name: providerData.name,
    address: providerData.address,
    annualIncome: providerData.annualIncome,
  };

  updateRequestVerified(requestId, verifiedRecord, defaultDataProvider.name);

  // 6. Return the verified result with technical audit metadata
  return {
    success: true,
    statusCode: 200,
    response: {
      requestId,
      status: 'VERIFIED',
      data: verifiedRecord,
      source: defaultDataProvider.name,
      technicalDetails: {
        requestId,
        service: req.service,
        consent: 'GRANTED',
        provider: defaultDataProvider.name,
        verification: 'SUCCESS',
        responseStatus: 200,
      },
    },
  };
}
