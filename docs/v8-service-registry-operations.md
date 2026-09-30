# EKSetu V8 — Service Registry, Advanced Security & Operations

## 1. V8 Objective

EKSetu Version 8 elevates the platform from an application-specific gateway into a **reusable government interoperability infrastructure**. While V1–V7 established core verification, consent, purpose-bound policies, structured provenance, citizen transparency, resilience, and legacy SOAP/XML adapters, V8 introduces centralized platform governance:

* **Centralized Service Registry**: Dynamically catalogs interoperable government providers, capabilities, protocols, versions, and administrative status.
* **Service Capability Discovery & Matching**: Validates requested operations against authoritative service capability profiles before routing.
* **Provider Health Monitoring & Telemetry**: Lightweight simulated health checks tracking availability, response latency, and status.
* **Platform Security & Administrative RBAC**: Role-based access control and token-based service authentication guarding administrative endpoints and telemetry.
* **Operational Metrics & Security Event Monitoring**: In-memory telemetry engine monitoring throughput, timeouts, security violations, and per-service distributions.
* **Operations Dashboard**: Dedicated UI for authorized system administrators to monitor real-time health, toggle provider statuses, register services, and audit security events.

---

## 2. Service Registry

The Service Registry (`backend/src/registry/serviceRegistry.ts`) serves as the authoritative catalog of all government services accessible via EKSetu. It replaces hardcoded provider logic with a structured registry that can be queried publicly (for non-sensitive metadata) or administratively.

Each service record includes:
```typescript
export interface RegisteredService {
  serviceId: string;           // E.g. EDUCATION, REVENUE, RESIDENCE, LEGACY_EDUCATION
  name: string;                // Plain English title
  department: string;          // Authoritative department
  description?: string;        // Functional scope description
  protocol: ServiceProtocol;   // 'REST' | 'SOAP_XML'
  apiVersion: string;          // 'v1.0.0', 'legacy-v1', etc.
  capabilities: string[];      // ['STUDENT_VERIFICATION', 'MARKS_VERIFICATION']
  supportedFields: string[];   // ['qualification', 'marksPercentage', ...]
  supportedPurposes: string[]; // Purpose-bound allowances
  providerId: string;          // Maps to backend provider adapter
  adapterType: string;         // 'REST_DEFAULT' | 'SOAP_XML_ADAPTER'
  status: ServiceStatus;       // 'ACTIVE' | 'DISABLED' | 'MAINTENANCE'
  healthStatus: HealthStatus;  // 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE'
  enabled: boolean;            // Master operational toggle
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
  lastHealthCheck?: string;    // ISO timestamp
  responseTimeMs?: number;     // Ping latency in ms
}
```

Pre-registered services:
1. `EDUCATION`: Modern REST provider for student enrollment, qualification, and marks verification.
2. `REVENUE`: REST provider for annual household income and economic status validation.
3. `RESIDENCE`: REST provider for domicile state and resident status authentication.
4. `LEGACY_EDUCATION`: Legacy SOAP/XML provider for secondary board certificates and historical records.

---

## 3. Provider Registry Relationship

EKSetu maintains strict separation between **Platform Service Cataloging** (`ServiceRegistry`) and **Protocol Adapter Execution** (`ProviderRegistry`):

```text
               EKSetu Interoperability Engine
                             │
                             ▼
                      Service Registry
            (Metadata, Capabilities, Status, Health)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
       REST Provider                  SOAP/XML Adapter
   (Modern Departments)           (Legacy Central Board)
            │                                 │
            └──────── Provider Registry ──────┘
                    (Execution Pipeline)
```

* `ServiceRegistry` answers: *Is this service registered? Is it active? Does it support the requested capability? What protocol does it use?*
* `ProviderRegistry` answers: *How do we construct, serialize, transmit, and parse the network request for this specific protocol?*

This layered design ensures that adding new protocols or registering new departments requires zero modification to core security or verification pipelines.

---

## 4. Service Capabilities

Services declare explicit capability tags. EKSetu evaluates these server-side before initiating verification calls:

* `STUDENT_VERIFICATION`
* `MARKS_VERIFICATION`
* `QUALIFICATION_CHECK`
* `INCOME_VERIFICATION`
* `ANNUAL_INCOME_CHECK`
* `DOMICILE_VERIFICATION`
* `STATE_RESIDENCE_CHECK`
* `LEGACY_SOAP_MARKS_VERIFICATION`
* `XML_DOCUMENT_VERIFY`

When an inbound request requires an unsupported capability (e.g., `TAX_HISTORY_VERIFICATION` requested against `EDUCATION`), the gateway halts immediately:
1. Rejects the request with HTTP 422 and error code `SERVICE_CAPABILITY_NOT_SUPPORTED`.
2. Records an audit event `CAPABILITY_NOT_SUPPORTED`.
3. Dispatches a security event `CAPABILITY_NOT_SUPPORTED`.
4. Zero provider network calls are made.

---

## 5. Provider Health

The health checker (`backend/src/registry/serviceHealth.ts`) performs lightweight health evaluations without invoking external production dependencies:
* `HEALTHY`: Provider is `ACTIVE`, operational, with responsive latency (5–30ms).
* `DEGRADED`: Provider is in `MAINTENANCE` state or experiencing transient latency.
* `UNAVAILABLE`: Provider is administratively `DISABLED`.

Administrators can trigger simulated pings on demand via `GET /api/v1/services/:serviceId/health`.

---

## 6. Service Versioning

Every service registers its API version:
* Modern REST services default to `v1.0.0`.
* Legacy central board gateways register `legacy-v1`.

The registry exposes version information to calling systems without requiring complex content negotiation, allowing multiple versions of a department provider to coexist.

---

## 7. Service-to-Service Authentication

Incoming callers are identified and authenticated via server-side credentials (`backend/src/security/serviceAuthentication.ts`):
* `x-api-key`: Shared secret API keys for partner services (`scholarship-portal-key`, `welfare-gateway-key`).
* `Authorization: Bearer <token>`: Bearer token format for automated gateways.
* `x-caller-id`: Caller identity header for trusted intranet VPC simulation.

All credentials are kept exclusively server-side and never leaked in client bundles or public APIs.

---

## 8. Service Authorization & RBAC

The authorization middleware (`backend/src/security/serviceAuthorization.ts`) enforces strict role-based separation:

| Role | Permissions | Allowed Actions |
| :--- | :--- | :--- |
| `ADMIN` | `*` | Service registration, status updates, metrics, security events |
| `SERVICE_CALLER` | `service:read`, `verify:request` | Initiate verifications, query public registry |
| `AUDITOR` | `audit:read`, `metrics:read` | View compliance logs, operational metrics |
| `CITIZEN` | `transparency:read` | View personal requests & data usage transparency |

If an unauthorized citizen attempts to access administrative endpoints (`/api/v1/admin/*`), the gateway rejects the call with **403 FORBIDDEN** and logs an `ADMIN_ACCESS_DENIED` security incident.

---

## 9. Admin Operations APIs

Protected by `ServiceAuthorization.requireAdmin`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/services` | Complete administrative service list |
| `POST` | `/api/v1/admin/services` | Register a new government service |
| `PATCH` | `/api/v1/admin/services/:id/status` | Update service status (`ACTIVE`, `DISABLED`, `MAINTENANCE`) |
| `GET` | `/api/v1/admin/metrics` | Gateway and provider operational telemetry |
| `GET` | `/api/v1/admin/security/events` | Audit log of security and access violations |

Public discovery endpoints (unprotected, sanitized):
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/services` | Public service catalog (zero confidential data) |
| `GET` | `/api/v1/services/:serviceId` | Public service profile |
| `GET` | `/api/v1/services/:serviceId/health` | Provider health check & ping latency |

---

## 10. Operational Metrics

The telemetry collector (`backend/src/operations/metricsService.ts`) tracks key platform metrics:
* Total verification requests initiated
* Successful verifications (`VERIFIED`)
* Partial verifications (`PARTIAL_VERIFIED`)
* Failed verifications (`FAILED`, `POLICY_DENIED`, etc.)
* Provider timeouts (`PROVIDER_TIMEOUT`, `LEGACY_PROVIDER_TIMEOUT`)
* Security violations (`UNAUTHORIZED_ACCESS_ATTEMPT`, `ADMIN_ACCESS_DENIED`, `RATE_LIMITED`)
* Average provider response latency (ms)
* Per-service traffic distribution

---

## 11. Security Event Monitoring

The security engine (`backend/src/operations/securityEventService.ts`) logs incidents in real-time:
* `UNAUTHORIZED_ACCESS_ATTEMPT`: Missing or invalid service tokens.
* `ADMIN_ACCESS_DENIED`: Unauthorized access to administrative operations.
* `SERVICE_DISABLED`: Verification attempted against a disabled provider.
* `CAPABILITY_NOT_SUPPORTED`: Client requested functionality outside provider scope.
* `RATE_LIMITED`: Caller exceeded gateway traffic throttling window.
* `DUPLICATE_REQUEST`: Replay of already finalized consent requests.

---

## 12. Audit Trail Integration

All administrative lifecycle actions are captured in the timestamped structured audit trail:
* `SERVICE_REGISTERED`: Recorded when an admin registers a new service.
* `SERVICE_ENABLED`: Recorded when a service is activated.
* `SERVICE_DISABLED`: Recorded when a service is administratively disabled.
* `SERVICE_STATUS_CHANGED`: Recorded upon maintenance mode transition.
* `SERVICE_HEALTH_CHECKED`: Recorded upon health check invocation.

---

## 13. Failure Handling & Isolation

In accordance with V6 and V7 principles, platform failures fail safely:
1. **Disabled Service**: If an admin disables `EDUCATION` and a verification request is initiated, the provider is not called, audit events are logged, and the status returns `SERVICE_UNAVAILABLE`.
2. **Unsupported Capability**: If a caller asks for unsupported data, the gateway halts before calling any provider, returning `SERVICE_CAPABILITY_NOT_SUPPORTED`.
3. **Admin Breach**: Unauthorized calls to admin endpoints return `403 FORBIDDEN` and zero internal metrics are disclosed.

---

## 14. Architecture Diagram

```text
                                CITIZEN
                                   │
                                   ▼
                           SCHOLARSHIP PORTAL
                                   │
                                   ▼
                             EKSETU GATEWAY
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
            PUBLIC API                         ADMIN API
        (Consent & Verify)               (Operations & Telemetry)
                  │                                 │
                  ▼                                 ▼
          Policy Engine / RBAC              Admin Authorization
                  │                                 │
                  ▼                                 ▼
           Service Registry                Operations Engine
        (Capability Validation)          (Metrics & Security Events)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   REST Providers     SOAP_XML Adapter
  (Edu, Rev, Res)    (Legacy Education)
```

---

## 15. Future Scalability

* **Distributed Rate Limiting**: Centralized Redis token bucket per registered caller.
* **Mutual TLS (mTLS)**: Cryptographic certificates for cross-government department backplanes.
* **Dynamic WSDL Ingestion**: Automatic parsing of partner legacy SOAP WSDL contracts into registry capabilities.
* **Distributed OpenTelemetry**: Exporting EKSetu operational traces to centralized government monitoring clusters.
