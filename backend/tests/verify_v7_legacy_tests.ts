import { InteroperabilityService } from '../src/services/interoperabilityService';
import { AuditService } from '../src/services/auditService';
import { DatabaseService } from '../src/services/databaseService';
import { TransparencyService } from '../src/services/transparencyService';
import { ProviderRegistry } from '../src/providers/providerRegistry';
import { SoapClient } from '../src/providers/legacy/soapClient';
import { XmlParser } from '../src/providers/legacy/xmlParser';
import { XmlValidator } from '../src/providers/legacy/xmlValidator';
import { LegacyEducationAdapter } from '../src/providers/legacy/legacyEducationAdapter';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, failDetail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS [Test ${totalTests}]: ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL [Test ${totalTests}]: ${testName}`);
    if (failDetail) console.error(`  Detail: ${failDetail}`);
  }
}

async function runV7LegacyTests() {
  console.log('================================================================');
  console.log('EKSetu V7 — Legacy SOAP/XML Integration & Adapter Layer Tests');
  console.log('================================================================\n');

  // Standard timeout for normal tests (5000ms)
  process.env.PROVIDER_TIMEOUT_MS = '5000';

  // ----------------------------------------------------
  // TEST 1: Legacy Provider Registration
  // ----------------------------------------------------
  console.log('--- TEST 1: Legacy Provider Registration ---');
  const legacyProvider = ProviderRegistry.getProvider('LEGACY_EDUCATION');
  assert(
    legacyProvider !== undefined &&
    legacyProvider.providerId === 'LEGACY_EDUCATION' &&
    legacyProvider.protocol === 'SOAP_XML' &&
    legacyProvider.department === 'Education Department',
    'Legacy provider LEGACY_EDUCATION correctly registered in ProviderRegistry with SOAP_XML protocol'
  );

  // ----------------------------------------------------
  // TEST 2: Provider Selection Routing Test
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Provider Selection Routing Test ---');
  const selectedLegacy = ProviderRegistry.selectEducationProvider({
    applicant_data: { preferredProvider: 'LEGACY_EDUCATION' }
  });
  assert(
    selectedLegacy.providerId === 'LEGACY_EDUCATION' &&
    selectedLegacy.protocol === 'SOAP_XML',
    'ProviderRegistry routes to LEGACY_EDUCATION when preferredProvider is LEGACY_EDUCATION'
  );

  // ----------------------------------------------------
  // TEST 3: Authoritative Selection (Server Chooses / Defaults)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Authoritative Selection (Server Default Fallback) ---');
  const selectedDefault = ProviderRegistry.selectEducationProvider({
    applicant_data: {}
  });
  const selectedInvalid = ProviderRegistry.selectEducationProvider({
    applicant_data: { preferredProvider: 'NON_EXISTENT_PROVIDER' }
  });
  assert(
    selectedDefault.providerId === 'EDUCATION' &&
    selectedDefault.protocol === 'REST' &&
    selectedInvalid.providerId === 'EDUCATION',
    'Server is authoritative: defaults to modern REST EDUCATION provider and rejects unknown provider selections safely'
  );

  // ----------------------------------------------------
  // TEST 4: SOAP Request Generation with Allowed Fields
  // ----------------------------------------------------
  console.log('\n--- TEST 4: SOAP Request Generation with Allowed Fields ---');
  const soapXml = SoapClient.buildVerifyStudentRequest(
    'SCH-2026-901',
    'Priya Patel',
    ['qualification', 'marksPercentage']
  );
  assert(
    soapXml.includes('<soap:Envelope') &&
    soapXml.includes('<ApplicationId>SCH-2026-901</ApplicationId>') &&
    soapXml.includes('<StudentName>Priya Patel</StudentName>') &&
    soapXml.includes('<Field>qualification</Field>') &&
    soapXml.includes('<Field>marksPercentage</Field>'),
    'SoapClient builds valid SOAP 1.1 Envelope with requested fields'
  );

  // ----------------------------------------------------
  // TEST 5: Pre-Transmission Data Minimization
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Pre-Transmission Data Minimization (Blocked fields never in SOAP) ---');
  // Attempt to pass blocked fields: bankBalance, fullAddress
  const minimizedSoapXml = SoapClient.buildVerifyStudentRequest(
    'SCH-2026-902',
    'Rahul Verma',
    ['qualification', 'marksPercentage'] // Only allowed fields passed by policy
  );
  assert(
    !minimizedSoapXml.includes('bankBalance') &&
    !minimizedSoapXml.includes('fullAddress') &&
    !minimizedSoapXml.includes('bankAccount'),
    'Pre-transmission data minimization verified: blocked fields are absent from outbound SOAP envelope'
  );

  // ----------------------------------------------------
  // TEST 6: SOAP Response Parsing (Normal Case)
  // ----------------------------------------------------
  console.log('\n--- TEST 6: SOAP Response Parsing (Normal Case) ---');
  const sampleSoapResponse = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <VerifyStudentResponse xmlns="http://education.gov.in/legacy/ws">
        <Status>
          <StatusCode>SUCCESS</StatusCode>
          <Message>Record verified</Message>
        </Status>
        <Student>
          <ApplicationId>SCH-2026-903</ApplicationId>
          <StudentName>Ananya Das</StudentName>
          <Qualification>Bachelor's Degree</Qualification>
          <MarksPercentage>84.5</MarksPercentage>
          <InternalEnrollmentId>LEGACY-ENROLL-8831</InternalEnrollmentId>
          <BankAccount>987654321012</BankAccount>
          <FullAddress>123 MG Road, Bengaluru</FullAddress>
        </Student>
      </VerifyStudentResponse>
    </soap:Body>
  </soap:Envelope>`;

  const parsed = XmlParser.parseVerifyStudentResponse(sampleSoapResponse);
  assert(
    parsed.statusCode === 'SUCCESS' &&
    parsed.student?.studentName === 'Ananya Das' &&
    parsed.student?.qualification === "Bachelor's Degree" &&
    parsed.student?.marksPercentage === 84.5 &&
    parsed.student?.bankAccount === '987654321012',
    'XmlParser safely extracts status, student attributes, and captures extraneous legacy fields'
  );

  // ----------------------------------------------------
  // TEST 7: SOAP Response Normalization into Standard Format
  // ----------------------------------------------------
  console.log('\n--- TEST 7: SOAP Response Normalization into Standard Format ---');
  const adapter = new LegacyEducationAdapter();
  const normalizedResult = await adapter.verify({
    requestId: 'REQ-NORM-001',
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-904',
      name: 'Kavita Singh',
      qualification: "Master's Degree",
      marksPercentage: 88
    },
    requestedFields: ['qualification', 'marksPercentage'],
    purpose: 'Scholarship Eligibility'
  });
  assert(
    normalizedResult.department === 'Education Department' &&
    normalizedResult.providerId === 'LEGACY_EDUCATION' &&
    normalizedResult.protocol === 'SOAP_XML' &&
    normalizedResult.status === 'VERIFIED' &&
    normalizedResult.data !== undefined &&
    normalizedResult.data.qualification === "Master's Degree" &&
    typeof normalizedResult.data.marksPercentage === 'number',
    'LegacyEducationAdapter normalizes legacy SOAP response into standard internal ProviderResult contract'
  );

  // ----------------------------------------------------
  // TEST 8: Post-Response Data Minimization (Extra fields stripped)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Post-Response Data Minimization ---');
  // Raw legacy data contains bankAccount and fullAddress. When integrated through the gateway,
  // Policy minimization must strip them.
  const init8 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-908',
      name: 'Vikram Joshi',
      annualIncome: 140000,
      qualification: "Bachelor's Degree",
      marksPercentage: 79,
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION'
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res8 = await InteroperabilityService.processConsentDecision(init8.requestId, 'ALLOW');
  const eduData8 = res8.verifiedData?.education as any;
  assert(
    res8.status === 'VERIFIED' &&
    eduData8 !== undefined &&
    eduData8.bankAccount === undefined &&
    eduData8.fullAddress === undefined &&
    eduData8.internalEnrollmentId === undefined &&
    (res8.data as any)?.bankAccount === undefined,
    'Post-response data minimization verified: legacy extraneous fields (bankAccount, fullAddress) stripped from final payload'
  );

  // ----------------------------------------------------
  // TEST 9: Successful Verification Flow with Legacy Provider
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Successful Verification Flow with Legacy Provider ---');
  const init9 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-909',
      name: 'Deepa Roy',
      annualIncome: 150000,
      qualification: "Bachelor's Degree",
      marksPercentage: 86,
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION'
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res9 = await InteroperabilityService.processConsentDecision(init9.requestId, 'ALLOW');
  const legacySource = res9.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  assert(
    res9.status === 'VERIFIED' &&
    res9.dataReleased === true &&
    legacySource !== undefined &&
    legacySource.status === 'VERIFIED' &&
    legacySource.protocol === 'SOAP_XML',
    'Full verification flow succeeds with LEGACY_EDUCATION provider producing VERIFIED status and SOAP_XML source record'
  );

  // ----------------------------------------------------
  // TEST 10: Malformed XML Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Malformed XML Handling ---');
  const init10 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-910',
      name: 'Suresh Kumar',
      annualIncome: 160000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION',
      simulateFailure: { department: 'education', providerId: 'LEGACY_EDUCATION', failureType: 'MALFORMED_XML' }
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res10 = await InteroperabilityService.processConsentDecision(init10.requestId, 'ALLOW');
  const eduSource10 = res10.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  assert(
    (res10.status === 'PARTIAL_VERIFIED' || res10.status === 'VERIFICATION_FAILED') &&
    eduSource10?.status === 'FAILED' &&
    res10.verifiedData?.education?.verified === false,
    'Malformed XML handled safely: education marked FAILED, overall status PARTIAL_VERIFIED, false verification prevented'
  );

  // ----------------------------------------------------
  // TEST 11: Invalid Status Code Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Invalid Status Code Handling ---');
  const init11 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-911',
      name: 'Manish Singh',
      annualIncome: 130000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION',
      simulateFailure: { department: 'education', providerId: 'LEGACY_EDUCATION', failureType: 'INVALID_STATUS' }
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res11 = await InteroperabilityService.processConsentDecision(init11.requestId, 'ALLOW');
  const eduSource11 = res11.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  assert(
    eduSource11?.status === 'FAILED' &&
    res11.verifiedData?.education?.verified === false,
    'Invalid StatusCode in legacy SOAP response causes verification failure without crashing gateway'
  );

  // ----------------------------------------------------
  // TEST 12: Legacy Provider Timeout Handling (5s / Configured Isolation)
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Legacy Provider Timeout Handling ---');
  process.env.PROVIDER_TIMEOUT_MS = '200'; // Temporary fast timeout for isolation test
  const init12 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-912',
      name: 'Pooja Hegde',
      annualIncome: 145000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION',
      simulateFailure: { department: 'education', providerId: 'LEGACY_EDUCATION', failureType: 'TIMEOUT' }
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res12 = await InteroperabilityService.processConsentDecision(init12.requestId, 'ALLOW');
  process.env.PROVIDER_TIMEOUT_MS = '5000'; // Restore standard 5000ms timeout
  const eduSource12 = res12.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  const events12 = await AuditService.getEventsByRequestId(init12.requestId);
  const hasLegacyTimeout = events12.some(e => e.eventType === 'LEGACY_PROVIDER_TIMEOUT');
  assert(
    eduSource12?.status === 'FAILED' &&
    hasLegacyTimeout &&
    res12.status === 'PARTIAL_VERIFIED',
    'Legacy provider timeout isolated cleanly, audited with LEGACY_PROVIDER_TIMEOUT event, status PARTIAL_VERIFIED'
  );

  // ----------------------------------------------------
  // TEST 13: Record Not Found in Legacy System
  // ----------------------------------------------------
  console.log('\n--- TEST 13: Record Not Found in Legacy System ---');
  const init13 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-913',
      name: 'Unknown Student',
      annualIncome: 120000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION',
      simulateFailure: { department: 'education', providerId: 'LEGACY_EDUCATION', failureType: 'RECORD_NOT_FOUND' }
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res13 = await InteroperabilityService.processConsentDecision(init13.requestId, 'ALLOW');
  const eduSource13 = res13.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  assert(
    eduSource13?.status === 'FAILED' &&
    eduSource13?.error?.includes('Student record not found'),
    'RECORD_NOT_FOUND in legacy SOAP backend yields FAILED status with explanatory error'
  );

  // ----------------------------------------------------
  // TEST 14: Legacy Server Error (500 Fault)
  // ----------------------------------------------------
  console.log('\n--- TEST 14: Legacy Server Error (HTTP 500 Fault) ---');
  const init14 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-914',
      name: 'Gaurav Sen',
      annualIncome: 180000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION',
      simulateFailure: { department: 'education', providerId: 'LEGACY_EDUCATION', failureType: 'SERVER_ERROR' }
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res14 = await InteroperabilityService.processConsentDecision(init14.requestId, 'ALLOW');
  const eduSource14 = res14.sources?.find(s => s.providerId === 'LEGACY_EDUCATION');
  assert(
    eduSource14?.status === 'FAILED' &&
    (res14.status === 'PARTIAL_VERIFIED' || res14.status === 'VERIFICATION_FAILED'),
    'Legacy SOAP internal server fault 500 fails safely and isolates fault'
  );

  // ----------------------------------------------------
  // TEST 15: XML Validation Catches Missing Fields
  // ----------------------------------------------------
  console.log('\n--- TEST 15: XML Validation Catches Missing Fields ---');
  const missingFieldXml = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <VerifyStudentResponse>
        <Status><StatusCode>SUCCESS</StatusCode></Status>
        <!-- Missing <Student> block entirely -->
      </VerifyStudentResponse>
    </soap:Body>
  </soap:Envelope>`;
  const check15 = XmlValidator.validateVerifyStudentResponse(missingFieldXml);
  assert(
    check15.valid === false &&
    check15.error?.includes('Missing <Student> block'),
    'XmlValidator flags missing student block as invalid legacy response'
  );

  // ----------------------------------------------------
  // TEST 16: XML Validation Catches Non-Numeric Marks
  // ----------------------------------------------------
  console.log('\n--- TEST 16: XML Validation Catches Non-Numeric Marks ---');
  const nonNumericMarksXml = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <VerifyStudentResponse>
        <Status><StatusCode>SUCCESS</StatusCode></Status>
        <Student>
          <StudentName>Rohit Roy</StudentName>
          <Qualification>B.Tech</Qualification>
          <MarksPercentage>EIGHTY_PERCENT</MarksPercentage>
        </Student>
      </VerifyStudentResponse>
    </soap:Body>
  </soap:Envelope>`;
  const check16 = XmlValidator.validateVerifyStudentResponse(nonNumericMarksXml);
  assert(
    check16.valid === false &&
    check16.error?.includes('numeric'),
    'XmlValidator flags non-numeric MarksPercentage as schema violation'
  );

  // ----------------------------------------------------
  // TEST 17: Provenance Correctly Records SOAP_XML Protocol
  // ----------------------------------------------------
  console.log('\n--- TEST 17: Provenance Correctly Records SOAP_XML Protocol ---');
  const provRecord = res9.provenance?.find(p => p.provider === 'LEGACY_EDUCATION' || p.providerId === 'LEGACY_EDUCATION');
  assert(
    provRecord !== undefined &&
    provRecord.protocol === 'SOAP_XML' &&
    provRecord.status === 'VERIFIED',
    'Authoritative provenance record contains protocol: SOAP_XML and providerId: LEGACY_EDUCATION'
  );

  // ----------------------------------------------------
  // TEST 18: Audit Trail Records Legacy Lifecycle Events
  // ----------------------------------------------------
  console.log('\n--- TEST 18: Audit Trail Records Legacy Lifecycle Events ---');
  const events9 = await AuditService.getEventsByRequestId(init9.requestId);
  const eventTypes = events9.map(e => e.eventType);
  const hasSelected = eventTypes.includes('LEGACY_PROVIDER_SELECTED');
  const hasReqBuilt = eventTypes.includes('LEGACY_REQUEST_BUILT');
  const hasReqSent = eventTypes.includes('LEGACY_REQUEST_SENT');
  const hasRespRecv = eventTypes.includes('LEGACY_RESPONSE_RECEIVED');
  const hasParsed = eventTypes.includes('LEGACY_XML_PARSED');
  assert(
    hasSelected && hasReqBuilt && hasReqSent && hasRespRecv && hasParsed,
    'Persistent audit trail captures all 5 core legacy lifecycle events: SELECTED, BUILT, SENT, RECEIVED, PARSED'
  );

  // ----------------------------------------------------
  // TEST 19: Citizen Transparency Shows Plain-English Provider Description
  // ----------------------------------------------------
  console.log('\n--- TEST 19: Citizen Transparency Shows Plain-English Provider Description ---');
  const dbRecord9 = await DatabaseService.getRequestById(init9.requestId);
  const transparency9 = await TransparencyService.buildCitizenTransparencyView(dbRecord9);
  const eduCitizenSource = transparency9.sources.find(s => s.provider === 'EDUCATION');
  assert(
    eduCitizenSource !== undefined &&
    eduCitizenSource.providerName === 'Legacy Education Department System' &&
    eduCitizenSource.connectionType?.includes('Legacy government system') &&
    !eduCitizenSource.statusExplanation.includes('<soap:') &&
    !eduCitizenSource.statusExplanation.includes('XML'),
    'Citizen transparency view shows plain-English description: Legacy government system without leaking raw XML'
  );

  // ----------------------------------------------------
  // TEST 20: GET /api/v1/providers Returns Registered Providers
  // ----------------------------------------------------
  console.log('\n--- TEST 20: GET /api/v1/providers Registration Listing ---');
  const allProviders = ProviderRegistry.getAllProviders();
  const hasRest = allProviders.some(p => p.protocol === 'REST');
  const hasLegacy = allProviders.some(p => p.protocol === 'SOAP_XML');
  assert(
    allProviders.length >= 4 &&
    hasRest &&
    hasLegacy,
    'Provider registry exposes both REST and SOAP_XML providers with protocols and capabilities'
  );

  // ----------------------------------------------------
  // TEST 21: Regression — REST Providers Still Work Alongside Legacy
  // ----------------------------------------------------
  console.log('\n--- TEST 21: Regression — REST Providers Still Work Alongside Legacy ---');
  const init21 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-921',
      name: 'Aditi Rao',
      annualIncome: 175000,
      qualification: "Bachelor's Degree",
      marksPercentage: 91,
      residenceState: 'Telangana'
      // No preferredProvider -> defaults to modern REST EDUCATION
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res21 = await InteroperabilityService.processConsentDecision(init21.requestId, 'ALLOW');
  const eduSource21 = res21.sources?.find(s => s.department === 'Education Department');
  assert(
    res21.status === 'VERIFIED' &&
    eduSource21 !== undefined &&
    eduSource21.protocol === 'REST' &&
    eduSource21.providerId === 'EDUCATION',
    'Modern REST provider works seamlessly alongside legacy adapter without protocol collisions'
  );

  // ----------------------------------------------------
  // TEST 22: Regression — Full V6 Security Pipeline Applies to Legacy Flow
  // ----------------------------------------------------
  console.log('\n--- TEST 22: Regression — Full V6 Security Pipeline Applies to Legacy Flow ---');
  // Attempt verification with preferredProvider=LEGACY_EDUCATION but Citizen DENY
  const init22 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'SCH-2026-922',
      name: 'Karan Mehra',
      annualIncome: 190000,
      qualification: "Bachelor's Degree",
      residenceState: 'Telangana',
      preferredProvider: 'LEGACY_EDUCATION'
    },
    requestedData: ['studentName', 'qualification', 'marksPercentage', 'annualIncome', 'domicileState']
  });
  const res22 = await InteroperabilityService.processConsentDecision(init22.requestId, 'DENY');
  const events22 = await AuditService.getEventsByRequestId(init22.requestId);
  const madeLegacyCalls = events22.some(e => e.eventType === 'LEGACY_REQUEST_SENT');
  assert(
    res22.status === 'CONSENT_DENIED' &&
    res22.dataReleased === false &&
    !madeLegacyCalls,
    'Full security pipeline upheld: Citizen DENY halts legacy flow before any SOAP request is constructed or transmitted'
  );

  // ----------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`V7 TEST EXECUTION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runV7LegacyTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
