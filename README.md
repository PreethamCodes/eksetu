# EKSetu — Government Interoperability Platform (V2: Consent & Authorization)

> **“Share Proof, Not Databases.”**  
> EKSetu is a consent- and policy-driven interoperability fabric that enables authorized government services to securely obtain only the verified information they need from existing departmental systems, without centralizing or duplicating citizen databases.

---

## 1. System Architecture (V2 Flow)

```text
CITIZEN
   │
   ▼
Scholarship Portal (Government Service)
   │
   │  "Verify with EKSetu"
   ▼
EKSetu Gateway (/api/v1/requests)
   │
   ▼
STATUS: CONSENT_PENDING (No department APIs called yet)
   │
   ▼
CONSENT SCREEN (Citizen reviews requested scopes)
   │
   ├── [ DENY ] ─────────────────────────┐
   │                                     ▼
   │                              CONSENT_DENIED
   │                          Zero Department Data Released
   │
   └── [ ALLOW ] ────────────────────────┐
                                         ▼
                                AUTHORIZATION CHECK
                                         │
                                         ▼
                              Interoperability Gateway
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
             Education API          Revenue API            Residence API
                  │                      │                      │
                  └──────────────────────┼──────────────────────┘
                                         ▼
                        Aggregated Verified Proof & Provenance
                                         │
                                         ▼
                        Scholarship Portal (✓ VERIFIED)
```

### Key Architectural Principles in V2
1. **Consent-First Architecture**: Department APIs are **NEVER** contacted when a request is created. They wait for citizen authorization.
2. **Server-Enforced Trust**: The backend—not the frontend—validates that valid consent has been granted before routing to providers.
3. **One-Time Purpose-Bound Access**: Consent is strictly scoped to `ONE_TIME` access for `Scholarship Eligibility`.
4. **Zero Data on Denial**: If the citizen clicks **DENY**, zero department calls are made, and zero data is returned or stored.
5. **Auditable Consent Provenance**: Every consent decision is recorded with a timestamp, service ID, requested scopes, and bound to the Request ID.

---

## 2. Project Structure

```text
EKSetu/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── requestController.ts        # /api/v1/requests & /api/health
│   │   │   ├── consentController.ts        # POST /api/v1/consent (ALLOW / DENY)
│   │   │   └── mockDepartmentController.ts # /api/mock/{education,revenue,residence}
│   │   ├── routes/
│   │   │   ├── apiRoutes.ts                # Gateway API routes
│   │   │   └── mockRoutes.ts               # Department simulation routes
│   │   ├── services/
│   │   │   ├── interoperabilityService.ts  # Gateway orchestration & aggregation
│   │   │   ├── consentService.ts           # Consent request creation & decision recording
│   │   │   ├── authorizationService.ts     # Trusted service verification (SCHOLARSHIP)
│   │   │   └── databaseService.ts          # Supabase & in-memory persistence
│   │   ├── providers/
│   │   │   ├── educationProvider.ts        # Higher Education registry adapter
│   │   │   ├── revenueProvider.ts          # Revenue / Income certificate adapter
│   │   │   └── residenceProvider.ts        # Domicile / Residence registry adapter
│   │   ├── models/
│   │   │   └── types.ts                    # Strongly typed contracts (V2 types)
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts             # Centralized error handler
│   │   │   └── validateRequest.ts          # Zod schema validation
│   │   ├── utils/
│   │   │   ├── requestIdGenerator.ts       # REQ-YYYYMMDD-XXXXX generator
│   │   │   └── supabaseClient.ts           # Supabase client with graceful fallback
│   │   ├── database/
│   │   │   └── schema.sql                  # PostgreSQL / Supabase table definitions
│   │   └── server.ts                       # Express gateway entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                  # Government banner & health status (V2 badge)
│   │   │   ├── Footer.tsx                  # Disclaimer & architecture tags
│   │   │   ├── StatusBadge.tsx             # VERIFIED / CONSENT_DENIED / PENDING badges
│   │   │   ├── ConsentModal.tsx            # Dedicated Citizen Consent Screen (ALLOW/DENY)
│   │   │   ├── ConsentDetailsCard.tsx      # Expandable Consent Record metadata
│   │   │   ├── VerificationProgress.tsx    # Stepper showing consent, auth, and provider calls
│   │   │   ├── DepartmentResultCard.tsx    # Source attribution & attribute cards
│   │   │   └── RequestTrace.tsx            # Expandable sequence flow trace
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx             # V2 Architecture overview & flow diagram
│   │   │   └── ScholarshipPage.tsx         # Scholarship form & V2 Consent/Verification UX
│   │   ├── services/
│   │   │   └── api.ts                      # Client API caller (initiate & submitConsent)
│   │   ├── types/
│   │   │   └── index.ts                    # UI TypeScript types
│   │   ├── App.tsx                         # Root app component
│   │   ├── main.tsx                        # Entry point
│   │   └── index.css                       # Tailwind styles
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md
```

---

## 3. API Documentation

### 3.1 Gateway Health Check
* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "ok",
  "service": "EKSetu API",
  "version": "2.0.0",
  "capabilities": ["INTEROPERABILITY", "CITIZEN_CONSENT", "AUTHORIZATION"]
}
```

### 3.2 Step 1: Initiate Verification Request
* **Endpoint**: `POST /api/v1/requests`
* **Request Body**:
```json
{
  "service": "SCHOLARSHIP",
  "applicant": {
    "applicationId": "SCH-2026-001",
    "name": "Sai Preetham",
    "dob": "2003-05-14",
    "qualification": "Bachelor's Degree",
    "annualIncome": 180000,
    "residenceState": "Telangana"
  },
  "requestedData": ["education", "income", "residence"],
  "purpose": "Scholarship Eligibility"
}
```
* **Response** (`200 OK` — No department calls executed):
```json
{
  "requestId": "REQ-20260930-8F42A",
  "service": "SCHOLARSHIP",
  "serviceName": "Scholarship Service",
  "status": "CONSENT_PENDING",
  "consent": {
    "purpose": "Scholarship Eligibility",
    "requestedFields": ["education", "income", "residence"],
    "consentType": "ONE_TIME",
    "createdAt": "2026-09-30T00:00:00.000Z"
  }
}
```

### 3.3 Step 2: Citizen Consent Decision
* **Endpoint**: `POST /api/v1/consent`
* **Request Body**:
```json
{
  "requestId": "REQ-20260930-8F42A",
  "decision": "ALLOW" // or "DENY"
}
```

#### Outcome A: ALLOW / GRANTED
```json
{
  "requestId": "REQ-20260930-8F42A",
  "service": "SCHOLARSHIP",
  "status": "VERIFIED",
  "consentStatus": "GRANTED",
  "authorizationStatus": "AUTHORIZED",
  "dataReleased": true,
  "verifiedData": {
    "education": { "qualification": "Bachelor's Degree", "studentStatus": "GRADUATE", "status": "VERIFIED" },
    "income": { "annualIncome": 180000, "incomeStatus": "VALID", "status": "VERIFIED" },
    "residence": { "state": "Telangana", "residenceStatus": "VALID", "status": "VERIFIED" }
  },
  "sources": [
    { "department": "Education Department", "status": "VERIFIED" },
    { "department": "Revenue Department", "status": "VERIFIED" },
    { "department": "Residence Department", "status": "VERIFIED" }
  ]
}
```

#### Outcome B: DENY / DENIED
```json
{
  "requestId": "REQ-20260930-8F42A",
  "service": "SCHOLARSHIP",
  "status": "CONSENT_DENIED",
  "consentStatus": "DENIED",
  "authorizationStatus": "NOT_AUTHORIZED",
  "dataReleased": false,
  "trace": [
    { "step": "CONSENT_DENIED", "message": "Citizen chose DENY. Interoperability request rejected." },
    { "step": "NO_DATA_RELEASED", "message": "Zero departmental data was retrieved or released. Department APIs were not contacted." }
  ]
}
```

### 3.4 Request Lookup Endpoint
* **Endpoint**: `GET /api/v1/requests/:requestId`
* Returns request record, consent decision, and verification results.

---

## 4. Database Schema (Supabase / PostgreSQL)

Run the script in `backend/src/database/schema.sql` on Supabase:

```sql
-- 1. verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) UNIQUE NOT NULL,
    service VARCHAR(64) NOT NULL,
    applicant_data JSONB NOT NULL,
    requested_data TEXT[] NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONSENT_PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. consents table (V2 Trust & Citizen Authorization Layer)
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) NOT NULL REFERENCES verification_requests(request_id) ON DELETE CASCADE,
    service VARCHAR(64) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    requested_fields TEXT[] NOT NULL,
    decision VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    consent_type VARCHAR(32) NOT NULL DEFAULT 'ONE_TIME',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. verification_results table
CREATE TABLE IF NOT EXISTS verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) NOT NULL REFERENCES verification_requests(request_id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    data JSONB NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Environment Variables

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000
```

---

## 6. How to Run Locally

### Start Backend
```powershell
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### Start Frontend
```powershell
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 7. Deployment Instructions

### Backend to Railway
1. Push code to GitHub.
2. In Railway, click **New Project** → **Deploy from GitHub repo**.
3. Set **Root Directory** to `backend`.
4. Configure environment variables (`PORT=5000`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### Frontend to Vercel
1. In Vercel, click **Add New Project** → Select repository.
2. Set **Root Directory** to `frontend`.
3. Set `VITE_API_BASE_URL` to your Railway API URL.
4. Deploy.
