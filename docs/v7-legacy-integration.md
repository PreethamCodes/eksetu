# EKSetu V7: Legacy SOAP/XML Integration & Adapter Layer Architecture

## 1. Executive Summary

Version 7 of **EKSetu** demonstrates how a modern, consent-driven, policy-governed national interoperability gateway can integrate seamlessly with **legacy government systems that communicate using SOAP/XML or older API formats**, while keeping EKSetu's core architectural guarantees strictly unchanged.

The fundamental principle governing this extension is **Protocol Isolation via the Adapter Pattern**:
> **Legacy protocols, XML payloads, SOAP envelopes, and legacy idiosyncrasies must be completely isolated behind provider adapters. The EKSetu core gateway communicates solely with an internal, normalized data contract.**

At no point does the EKSetu core router parse raw XML, construct SOAP envelopes, or bypass security, consent, policy evaluation, data minimization, provenance tracking, or audit logging. Whether an authoritative government registry uses a modern OpenAPI REST endpoint or a 15-year-old SOAP/XML Web Service, EKSetu applies identical standards of citizen consent, pre-transmission request minimization, post-transmission response minimization, fault containment, and citizen transparency.

---

## 2. Why Governments Have Legacy Systems: Real-World Context

In national public digital infrastructure, modernizing government IT is not a synchronous, overnight event. National and state governments operate heterogeneous IT ecosystems characterized by:

1. **Decades of Investment**: Core registries (education boards, land records, vehicle registration, treasuries, social welfare databases) were often built in the early 2000s or 2010s using Java EE, .NET Framework, Oracle Fusion, or IBM WebSphere, exposing SOAP/XML web services defined by WSDL contracts.
2. **High Replacement Risk & Cost**: Replacing stable, operational core record systems costs millions of dollars and risks service disruption for millions of citizens.
3. **Multi-Speed Digital Governance**: Different ministries and state departments modernize at varying paces. State education boards may remain on SOAP 1.1/1.2 while central portals migrate to REST/gRPC.
4. **The Gateway's True Mandate**: A national interoperability gateway like EKSetu cannot mandate that every department rewrite its backends before connecting. Instead, the gateway must meet departments where they are, absorbing protocol complexity without compromising security or citizen privacy.

---

## 3. The Adapter Pattern in EKSetu: Protocol Isolation

EKSetu uses the **Hexagonal / Adapter Architecture** to decouple the core interoperability engine from protocol-specific implementations.

```text
+-----------------------------------------------------------------------------------+
|                                  EKSetu Core                                      |
|  (Consent, Authorization, Policy Engine, Minimization, Provenance, Audit Trail)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Normalized ProviderRequest
                                         v
                         +-------------------------------+
                         |     VerificationProvider      |  (Internal Contract)
                         +-------------------------------+
                                 /               \
                                /                 \
        +----------------------------+   +------------------------------------+
        |   Modern REST Adapter      |   |   LegacyEducationAdapter           |
        |   (JSON / HTTP REST)       |   |   (SOAP / XML)                     |
        +----------------------------+   +------------------------------------+
                      |                                    |
                      | JSON over HTTP                     | SOAP 1.1 Envelope / XML
                      v                                    v
        +----------------------------+   +------------------------------------+
        | Modern Education/Tax API   |   | Legacy State Education Registry    |
        +----------------------------+   +------------------------------------+
```

### Key Isolation Invariants:
1. **Core Zero-XML Knowledge**: Core services (`InteroperabilityService`, `PolicyService`, `AuditService`, `ConsentService`) never import XML parsers or manipulate SOAP tags.
2. **Bi-Directional Normalization**:
   - Outbound: Normalized `ProviderRequest` is translated into a SOAP Envelope with `<RequestedFields>`.
   - Inbound: SOAP Response XML is validated, parsed, and translated into a normalized `ProviderResult`.
3. **Pluggable Registration**: Providers register with `ProviderRegistry`, exposing their protocol (`REST` or `SOAP_XML`), capabilities, and supported fields.

---

## 4. Protocol Comparison: REST vs SOAP/XML

| Feature | Modern REST Provider (`EDUCATION`) | Legacy SOAP/XML Provider (`LEGACY_EDUCATION`) |
| :--- | :--- | :--- |
| **Data Format** | JSON (JavaScript Object Notation) | XML with SOAP 1.1 / 1.2 Envelope |
| **Contract** | OpenAPI / TypeScript interfaces | WSDL / XSD Schema / Custom XML structure |
| **Envelope** | Standard HTTP headers and JSON body | `<soap:Envelope>`, `<soap:Header>`, `<soap:Body>` |
| **Field Specification** | Query params or JSON array | Nested XML elements (`<RequestedFields><Field>...`) |
| **Error Format** | HTTP Status Codes + JSON Error Object | SOAP Fault (`<soap:Fault>`, `<faultcode>`, `<faultstring>`) or domain XML |
| **Extraneous Data** | Typically sanitized at source | Often returns large legacy blocks (e.g. `<BankAccount>`, `<FullAddress>`) |
| **Vulnerabilities** | Standard JSON injection | XML External Entity (XXE), Billion Laughs DTD expansion |
| **Gateway Treatment** | Handled natively via TS object | Isolated in `LegacyEducationAdapter`, validated via safe parser |

---

## 5. Internal Normalized Provider Contract

All providers in EKSetu implement the authoritative `VerificationProvider` interface:

```typescript
export interface ProviderRequest {
  requestId: string;
  service: string;
  applicant: ApplicantInfo;
  requestedFields: string[]; // PRE-MINIMIZED by Policy Engine
  purpose: string;
  simulateFailure?: ProviderSimulationConfig;
}

export interface ProviderResult {
  department: string;
  providerId: string;
  providerName: string;
  protocol: ProviderProtocol; // 'REST' | 'SOAP_XML'
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  data?: Record<string, any>;
  error?: string;
  failureType?: FailureType;
  verifiedAt: string;
  metadata?: Record<string, any>;
}

export interface VerificationProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly department: string;
  readonly protocol: ProviderProtocol;
  readonly supportedFields: string[];

  verify(request: ProviderRequest): Promise<ProviderResult>;
}
```

The gateway only interacts with this contract. The returned `data` is always a normalized JavaScript object with standardized field names (`studentName`, `marksPercentage`, `qualification`).

---

## 6. Pre-Transmission Request Data Minimization

A critical principle of privacy engineering is **Pre-Transmission Minimization**:
> **Never send fields to a provider that the Policy Engine has not authorized, even if the service or citizen originally mentioned them.**

In EKSetu:
1. Citizen gives consent for a verification request.
2. The Policy Engine evaluates the service's authorized purpose against the requested data.
3. Extraneous or sensitive fields (e.g., `bankBalance`, `fullAddress`) are **blocked server-side**.
4. The remaining `allowedFields` are passed into `ProviderRequest.requestedFields`.
5. The `SoapClient` constructs the outbound SOAP message:
   ```xml
   <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
     <soap:Body>
       <VerifyStudentRequest>
         <ApplicationId>SCH-2026-001</ApplicationId>
         <StudentName>Sai Preetham</StudentName>
         <RequestedFields>
           <Field>qualification</Field>
           <Field>marksPercentage</Field>
         </RequestedFields>
       </VerifyStudentRequest>
     </soap:Body>
   </soap:Envelope>
   ```
6. **Verification Guarantee**: Blocked fields (such as `bankBalance` or `fullAddress`) are **never emitted in `<RequestedFields>`**. The legacy backend never receives a request for unauthorized data.

---

## 7. Post-Response Data Minimization

Legacy government systems frequently ignore field filtering and return entire database rows. For example, the legacy education simulator returns:
- `<StudentName>Sai Preetham</StudentName>`
- `<Qualification>Bachelor of Science</Qualification>`
- `<MarksPercentage>82</MarksPercentage>`
- `<InternalEnrollmentId>LEGACY-ENROLL-9842</InternalEnrollmentId>`
- `<BankAccount>987654321012</BankAccount>`
- `<FullAddress>Flat 402, Royal Residency, Hyderabad</FullAddress>`

### The Two-Tier Minimization Defense:
1. **Adapter Normalization**: The `XmlParser` extracts only known fields into the normalized result structure.
2. **Policy Engine Response Minimization**: `PolicyService.minimizeEducationData()` evaluates the normalized record against `policyResult.allowedFields`.
   - Fields not on the allowed list (`bankAccount`, `fullAddress`, `internalEnrollmentId`) are **permanently stripped**.
   - Audit event `RESPONSE_MINIMIZED` is emitted.
   - The citizen and requesting service receive strictly clean, minimized data.

---

## 8. XML Security Considerations

XML processing is notoriously susceptible to parser-level attacks. EKSetu implements multi-layer XML security in `XmlValidator`:

```text
[ Incoming XML Payload ]
          |
          v
+-----------------------------------------------------------+
| 1. DoS Prevention: Length Limit (<= 1MB)                  |
+-----------------------------------------------------------+
          |
          v
+-----------------------------------------------------------+
| 2. XXE Defense: Scan for <!DOCTYPE and <!ENTITY>          |
|    -> Rejects payload immediately if DTD entities exist   |
+-----------------------------------------------------------+
          |
          v
+-----------------------------------------------------------+
| 3. Well-Formedness: Tag balance & envelope structure      |
+-----------------------------------------------------------+
          |
          v
+-----------------------------------------------------------+
| 4. Schema & Data Sanity: Status codes & numeric types     |
+-----------------------------------------------------------+
          |
          v
[ Safe to Parse & Normalize ]
```

### Specific Defenses:
- **XML External Entity (XXE) Injection**: Reject any XML containing `<!DOCTYPE` or `<!ENTITY`. This prevents file disclosure (`file:///etc/passwd`) or SSRF through entity expansion.
- **Billion Laughs / Entity Expansion**: Because DTD declarations are unconditionally prohibited, recursive entity expansion attacks are neutralized.
- **Payload Size Clamping**: Requests exceeding 1 MB are rejected before parsing to prevent CPU/memory exhaustion.
- **Payload Sanitization for Logging**: Passwords, tokens, or PII inside XML strings are sanitized before any log emission.

---

## 9. Safe Failure Handling for Legacy Protocols

Legacy systems fail in complex ways: malformed XML tags, missing closing elements, unexpected SOAP faults, or proprietary status codes.

### Invariant: Safe Failure
> **A legacy parsing or protocol failure must NEVER be interpreted as verification success.**

1. **Malformed XML**: If the legacy system outputs truncated or invalid XML, `XmlValidator` flags `MALFORMED_XML`. The adapter returns:
   - `status: 'FAILED'`
   - `failureType: 'MALFORMED_XML'`
   - Emits audit event `LEGACY_XML_VALIDATION_FAILED`
   - Gateway status becomes `PARTIAL_VERIFIED` or `VERIFICATION_FAILED` (data released: `false`).
2. **Invalid Status Code**: If the legacy system returns an unknown status (e.g. `UNKNOWN_CODE`), validation rejects it. The field remains unverified.
3. **HTTP 500 / Server Error**: Handled as an operational fault, returning `status: 'FAILED'` and recording `LEGACY_PROVIDER_FAILED`.

---

## 10. Timeout Isolation & Fault Containment

Legacy systems often suffer from high latency, database locks, or connection pooling exhaustion.

### Circuit Protection & Timeout Isolation:
- Every provider call is wrapped in `InteroperabilityService.callProviderWithTimeout()`.
- Default timeout: **5,000 ms** (configurable via `PROVIDER_TIMEOUT_MS`).
- If the legacy system hangs, EKSetu does not block indefinitely. At 5000ms:
  1. The promise is aborted.
  2. The failure is recorded with `LEGACY_PROVIDER_TIMEOUT` and `PROVIDER_TIMEOUT`.
  3. The request transitions gracefully to `PARTIAL_VERIFIED` (if other providers succeeded) or `VERIFICATION_FAILED`.
  4. The client receives an immediate, clean response rather than an HTTP 504 Gateway Timeout.

---

## 11. Provenance & Audit Trail with Protocol Visibility

Auditors and administrators need complete visibility into which protocol was used to verify each attribute.

### Provenance Tracking:
Each verified field in `result.provenance` records:
- `field`: The attribute name (e.g., `qualification`).
- `provider`: `LEGACY_EDUCATION`.
- `providerName`: `Legacy Education Department System`.
- `protocol`: `SOAP_XML` (or `REST` for modern providers).
- `status`: `VERIFIED`.
- `verifiedAt`: ISO 8601 timestamp.

### Structured Audit Events:
V7 adds 8 legacy-specific lifecycle events to the **Persistent Structured Audit Trail**:
1. `LEGACY_PROVIDER_SELECTED`: Authoritative router selected legacy SOAP provider.
2. `LEGACY_REQUEST_BUILT`: SOAP envelope constructed with minimized fields.
3. `LEGACY_REQUEST_SENT`: Outbound SOAP request transmitted.
4. `LEGACY_RESPONSE_RECEIVED`: Raw SOAP/XML response captured.
5. `LEGACY_XML_PARSED`: Response parsed and normalized.
6. `LEGACY_XML_VALIDATION_FAILED`: Parser or schema check failed on legacy response.
7. `LEGACY_PROVIDER_TIMEOUT`: Legacy service exceeded 5000ms isolation deadline.
8. `LEGACY_PROVIDER_FAILED`: Legacy service returned an application or server error.

---

## 12. Citizen Transparency with Legacy Systems

While auditors need technical protocol details, citizens require clear, respectful, plain-English explanations.

### Principles for Citizen Visibility:
1. **Plain-English Connection Labels**:
   - Modern API: `"Modern government system (REST API)"`
   - Legacy API: `"Legacy government system (SOAP/XML)"`
2. **Zero Raw XML Leakage**: Citizens never see raw SOAP envelopes, XML tags, or exception stack traces.
3. **Clear Minimization Assurance**: The citizen transparency view explicitly confirms:
   - Only policy-allowed fields were sent to the legacy department.
   - Extra fields returned by the legacy system were stripped before storage or display.
4. **Activity Timeline**: Simplified timeline events explain legacy operations:
   - *"Connected to legacy government education system using SOAP/XML protocol"*
   - *"Constructed data-minimized legacy request with only permitted fields"*
   - *"Safely parsed and validated legacy data format"*

---

## 13. How to Add a New Legacy Provider: Developer Guide

Adding a new legacy department adapter (e.g., `LegacyLandRecordsAdapter`) requires 4 modular steps without modifying core gateway logic:

### Step 1: Implement `VerificationProvider`
Create `backend/src/providers/legacy/legacyLandRecordsAdapter.ts`:
```typescript
import { VerificationProvider, ProviderRequest, ProviderResult } from '../providerInterface';

export class LegacyLandRecordsAdapter implements VerificationProvider {
  readonly providerId = 'LEGACY_LAND_RECORDS';
  readonly providerName = 'Legacy State Land Records System';
  readonly department = 'Land Administration Department';
  readonly protocol = 'SOAP_XML';
  readonly supportedFields = ['propertyOwnership', 'landParcelId', 'holdingArea'];

  async verify(request: ProviderRequest): Promise<ProviderResult> {
    // 1. Build SOAP Envelope containing ONLY request.requestedFields
    // 2. Dispatch with timeout
    // 3. Validate XML response for XXE and structure
    // 4. Return normalized ProviderResult
  }
}
```

### Step 2: Register in `ProviderRegistry`
In `backend/src/providers/providerRegistry.ts`:
```typescript
ProviderRegistry.registerProvider(new LegacyLandRecordsAdapter());
```

### Step 3: Define Request Routing Rule
In `ProviderRegistry.selectProvider(department, requestRecord)`:
```typescript
if (department === 'LAND_RECORDS') {
  return requestRecord.applicant_data?.useLegacy
    ? ProviderRegistry.getProvider('LEGACY_LAND_RECORDS')!
    : ProviderRegistry.getProvider('LAND_RECORDS')!;
}
```

### Step 4: Add Minimization Filter in `PolicyService`
Ensure `PolicyService.minimizeLandData(raw, allowedFields)` exists to strip unapproved legacy fields.

---

## 14. Future Considerations

As EKSetu evolves toward enterprise production readiness, the adapter architecture readily supports advanced legacy capabilities:

1. **WSDL Auto-Generation & Ingestion**: Dynamically importing WSDL definitions to auto-generate XML schemas and field mappings.
2. **MTOM (Message Transmission Optimization Mechanism)**: Handling signed PDF certificates or biometric attachments embedded within legacy SOAP packages.
3. **WS-Security (WSS) & XML Digital Signatures**: Implementing OASIS WS-Security headers with X.509 mutual certificate signing and canonicalized XML verification (`ds:Signature`).
4. **Legacy Asynchronous Callbacks**: Supporting WS-Addressing (`wsa:ReplyTo`) for legacy systems that process verifications asynchronously via webhooks.
5. **Bidirectional Protocol Bridging**: Allowing legacy government consumers (SOAP clients) to consume EKSetu via a SOAP fronting facade while the core remains protocol-agnostic.
