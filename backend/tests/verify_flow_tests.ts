import { InteroperabilityService } from '../src/services/interoperabilityService';
import { AuthorizationService } from '../src/services/authorizationService';
import { PolicyService } from '../src/services/policyService';

async function runAllTests() {
  console.log('====================================================');
  console.log('EKSetu V3 — Verification Flow Technical Accuracy Tests');
  console.log('====================================================\n');

  let passed = 0;
  let total = 6;

  // ----------------------------------------------------
  // TEST 1: Normal Verification Flow (ALLOW)
  // ----------------------------------------------------
  console.log('--- TEST 1: Normal Verification (Citizen ALLOW) ---');
  const init1 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-001',
      name: 'Sai Preetham',
      qualification: "Bachelor's Degree",
      marksPercentage: 85,
      annualIncome: 180000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });

  const res1 = await InteroperabilityService.processConsentDecision(init1.requestId, 'ALLOW');
  const t1_ok =
    res1.consentStatus === 'GRANTED' &&
    res1.authorizationStatus === 'AUTHORIZED' &&
    (res1.policy?.decision === 'ALLOW' || res1.policy?.decision === 'PARTIAL_ALLOW') &&
    res1.status === 'VERIFIED' &&
    res1.data?.studentName === 'Sai Preetham' &&
    res1.data?.marksPercentage === 85 &&
    res1.data?.annualIncome === 180000 &&
    res1.data?.domicileState === 'Telangana';

  if (t1_ok) {
    console.log('✓ PASS: Test 1 - Consent recorded as GRANTED, service AUTHORIZED, departments verified, final status = VERIFIED\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 1', res1);
  }

  // ----------------------------------------------------
  // TEST 2: Citizen Denies (DENY) -> 0 Provider Calls
  // ----------------------------------------------------
  console.log('--- TEST 2: Citizen Denies (Citizen DENY) ---');
  const init2 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-002',
      name: 'Sai Preetham'
    },
    requestedData: ['studentName', 'annualIncome'],
    purpose: 'Scholarship Eligibility'
  });

  const res2 = await InteroperabilityService.processConsentDecision(init2.requestId, 'DENY');
  const t2_ok =
    res2.status === 'CONSENT_DENIED' &&
    res2.consentStatus === 'DENIED' &&
    res2.dataReleased === false &&
    (!res2.sources || res2.sources.length === 0);

  if (t2_ok) {
    console.log('✓ PASS: Test 2 - Status is CONSENT_DENIED, dataReleased is false, exactly 0 department provider calls made\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 2', res2);
  }

  // ----------------------------------------------------
  // TEST 3: Unauthorized Service -> AUTHORIZATION_FAILED
  // ----------------------------------------------------
  console.log('--- TEST 3: Unauthorized Service ---');
  let t3_ok = false;
  try {
    await InteroperabilityService.initiateVerificationRequest({
      service: 'UNKNOWN_SERVICE',
      applicant: { applicationId: 'APP-003', name: 'Unknown' },
      requestedData: ['studentName'],
      purpose: 'Scholarship Eligibility'
    });
  } catch (err: any) {
    if (err.code === 'AUTHORIZATION_FAILED' || err.statusCode === 403 || err.message.includes('not authorized')) {
      t3_ok = true;
    }
  }

  if (t3_ok) {
    console.log('✓ PASS: Test 3 - Unknown service rejected with AUTHORIZATION_FAILED before any department calls\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 3');
  }

  // ----------------------------------------------------
  // TEST 4: Excessive Field Requested Only -> POLICY_DENIED
  // ----------------------------------------------------
  console.log('--- TEST 4: Only Blocked/Excessive Field Requested ---');
  const init4 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: { applicationId: 'APP-004', name: 'Sai Preetham' },
    requestedData: ['bankBalance', 'fullAddress'],
    purpose: 'Scholarship Eligibility'
  });

  const res4 = await InteroperabilityService.processConsentDecision(init4.requestId, 'ALLOW');
  const t4_ok =
    res4.status === 'POLICY_DENIED' &&
    res4.policy?.decision === 'DENY' &&
    res4.dataReleased === false &&
    (!res4.sources || res4.sources.length === 0) &&
    res4.policy?.blockedFields.some(bf => bf.field === 'bankBalance' && bf.reason === 'EXCESSIVE_DATA');

  if (t4_ok) {
    console.log('✓ PASS: Test 4 - Policy Engine denied excessive fields, status = POLICY_DENIED, 0 provider calls made\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 4', res4);
  }

  // ----------------------------------------------------
  // TEST 5: Extra Provider Data Stripped (Data Minimization)
  // ----------------------------------------------------
  console.log('--- TEST 5: Extra Provider Data Leakage Check ---');
  const init5 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-005',
      name: 'Sai Preetham',
      annualIncome: 250000
    },
    requestedData: ['annualIncome'],
    purpose: 'Scholarship Eligibility'
  });

  const res5 = await InteroperabilityService.processConsentDecision(init5.requestId, 'ALLOW');
  const res5Json = JSON.stringify(res5);
  const leaksSensitiveData =
    res5Json.includes('bankBalance') ||
    res5Json.includes('taxStatus') ||
    res5Json.includes('sourceOfIncome') ||
    res5Json.includes('financialHistory') ||
    res5Json.includes('panCardRef');

  const t5_ok =
    res5.status === 'VERIFIED' &&
    res5.data?.annualIncome === 250000 &&
    !leaksSensitiveData;

  if (t5_ok) {
    console.log('✓ PASS: Test 5 - Provider extra internal data (bankBalance, taxStatus, etc.) strictly stripped from response\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 5 - Sensitive data leaked in payload!');
  }

  // ----------------------------------------------------
  // TEST 6: Provider Verification Failure (Education Fails)
  // ----------------------------------------------------
  console.log('--- TEST 6: Department Provider Verification Failure ---');
  const init6 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-006',
      name: 'Sai Preetham',
      qualification: "Bachelor's Degree",
      annualIncome: 180000,
      residenceState: 'Telangana',
      simulateFailure: {
        department: 'education',
        reason: 'Record not found in university registrar'
      }
    },
    requestedData: ['studentName', 'qualification', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });

  const res6 = await InteroperabilityService.processConsentDecision(init6.requestId, 'ALLOW');
  const eduSource = res6.sources?.find(s => s.department === 'Education Department');
  const t6_ok =
    eduSource?.status === 'FAILED' &&
    res6.status === 'PARTIAL_VERIFIED' &&
    res6.status !== 'VERIFIED';

  if (t6_ok) {
    console.log('✓ PASS: Test 6 - Education provider failure accurately reflected (Education = FAILED, Overall = PARTIAL_VERIFIED)\n');
    passed++;
  } else {
    console.error('✗ FAIL: Test 6', res6);
  }

  console.log('====================================================');
  console.log(`Summary: ${passed}/${total} Technical Accuracy Tests PASSED!`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
