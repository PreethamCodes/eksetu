# EKSetu — Government Interoperability Platform (V1 Prototype)

> **“Share Proof, Not Databases.”**  
> EKSetu is a consent- and policy-driven interoperability fabric that enables authorized government services to securely obtain only the verified information they need from existing departmental systems, without centralizing or duplicating citizen databases.

---

## 1. System Architecture

```text
CITIZEN
   │
   ▼
Scholarship Portal (Government Service)
   │
   │  "Verify Automatically with EKSetu"
   ▼
EKSetu Gateway (/api/v1/requests)
   │
   ├── Education Department API (/api/mock/education)
   ├── Revenue Department API   (/api/mock/revenue)
   └── Residence Department API (/api/mock/residence)
   │
   ▼
Aggregated Verified Proof & Provenance
   │
   ▼
Scholarship Portal Result Screen (✓ Verified)
```

### Key Architectural Principles
1. **Existing Government Services remain citizen-facing**: Citizens do not have to leave their portal to manage separate logins.
2. **EKSetu is the interoperability layer, not a destination database**: Departmental source registries remain authoritative.
3. **Attribute-level verification & data minimization**: Services receive only verified proof (e.g. `qualification: "Bachelor's Degree"`), not entire citizen dossiers.
4. **End-to-end traceability**: Every transaction generates a unique `Request ID` and an auditable execution trace.

---

## 2. Project Structure

```text
EKSetu/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── requestController.ts        # /api/v1/requests & /api/health
│   │   │   └── mockDepartmentController.ts # /api/mock/{education,revenue,residence}
│   │   ├── routes/
│   │   │   ├── apiRoutes.ts                # Gateway API routes
│   │   │   └── mockRoutes.ts               # Department simulation routes
│   │   ├── services/
│   │   │   ├── interoperabilityService.ts  # Gateway orchestration & aggregation
│   │   │   └── databaseService.ts          # Supabase & in-memory persistence
│   │   ├── providers/
│   │   │   ├── educationProvider.ts        # Higher Education registry adapter
│   │   │   ├── revenueProvider.ts          # Revenue / Income certificate adapter
│   │   │   └── residenceProvider.ts        # Domicile / Residence registry adapter
│   │   ├── models/
│   │   │   └── types.ts                    # Strongly typed contracts
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
│   │   │   ├── Header.tsx                  # Government banner & health status
│   │   │   ├── Footer.tsx                  # Disclaimer & architecture tags
│   │   │   ├── StatusBadge.tsx             # VERIFIED / PARTIAL / FAILED badges
│   │   │   ├── VerificationProgress.tsx    # Multi-department orchestration stepper
│   │   │   ├── DepartmentResultCard.tsx    # Source attribution & attribute cards
│   │   │   └── RequestTrace.tsx            # Expandable sequence flow trace
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx             # Platform overview & flow diagram
│   │   │   └── ScholarshipPage.tsx         # Scholarship form & verification UX
│   │   ├── services/
│   │   │   └── api.ts                      # Client API caller
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
  "version": "1.0.0"
}
```

### 3.2 Primary Verification Gateway
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
  "requestedData": [
    "education",
    "income",
    "residence"
  ]
}
```
* **Response**:
```json
{
  "requestId": "REQ-20260929-8F42A",
  "service": "SCHOLARSHIP",
  "status": "VERIFIED",
  "applicant": {
    "applicationId": "SCH-2026-001",
    "name": "Sai Preetham"
  },
  "verifiedData": {
    "education": {
      "qualification": "Bachelor's Degree",
      "studentStatus": "GRADUATE",
      "status": "VERIFIED"
    },
    "income": {
      "annualIncome": 180000,
      "incomeStatus": "VALID",
      "status": "VERIFIED"
    },
    "residence": {
      "state": "Telangana",
      "residenceStatus": "VALID",
      "status": "VERIFIED"
    }
  },
  "sources": [
    { "department": "Education Department", "status": "VERIFIED", "verifiedAt": "2026-09-29T17:42:00.000Z" },
    { "department": "Revenue Department", "status": "VERIFIED", "verifiedAt": "2026-09-29T17:42:00.050Z" },
    { "department": "Residence Department", "status": "VERIFIED", "verifiedAt": "2026-09-29T17:42:00.100Z" }
  ],
  "trace": [
    { "step": "REQUEST_CREATED", "message": "Verification request initiated...", "status": "SUCCESS", "timestamp": "..." },
    { "step": "EDUCATION_DEPARTMENT_VERIFIED", "message": "Education Department API contacted...", "status": "SUCCESS", "timestamp": "..." },
    { "step": "REVENUE_DEPARTMENT_VERIFIED", "message": "Revenue Department API contacted...", "status": "SUCCESS", "timestamp": "..." },
    { "step": "RESIDENCE_DEPARTMENT_VERIFIED", "message": "Residence Department API contacted...", "status": "SUCCESS", "timestamp": "..." },
    { "step": "DATA_AGGREGATED", "message": "Aggregated data from 3 department sources", "status": "SUCCESS", "timestamp": "..." },
    { "step": "VERIFICATION_COMPLETE", "message": "EKSetu interoperability orchestration complete.", "status": "SUCCESS", "timestamp": "..." }
  ],
  "timestamp": "2026-09-29T17:42:00.120Z"
}
```

### 3.3 Mock Department Endpoints
* **Education**: `POST /api/mock/education` or `GET /api/mock/education`
* **Revenue**: `POST /api/mock/revenue` or `GET /api/mock/revenue`
* **Residence**: `POST /api/mock/residence` or `GET /api/mock/residence`

---

## 4. Database Schema (Supabase / PostgreSQL)

Run the script in `backend/src/database/schema.sql` on Supabase:

```sql
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) UNIQUE NOT NULL,
    service VARCHAR(64) NOT NULL,
    applicant_data JSONB NOT NULL,
    requested_data TEXT[] NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

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

*Note: The backend has an automatic in-memory persistence fallback so local development and unit testing operate seamlessly even without active Supabase credentials.*

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

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## 7. Deployment Instructions

### Deploying Backend to Railway
1. Push the repository to GitHub.
2. In Railway, click **New Project** → **Deploy from GitHub repo**.
3. Set the Root Directory to `/backend`.
4. Configure Environment Variables:
   - `PORT=5000`
   - `SUPABASE_URL=<your-supabase-url>`
   - `SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>`
5. Deploy and copy your Railway URL (e.g. `https://eksetu-api.up.railway.app`).

### Deploying Frontend to Vercel
1. In Vercel, click **Add New** → **Project** → select the GitHub repository.
2. Set Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   - `VITE_API_BASE_URL=https://eksetu-api.up.railway.app`
5. Click **Deploy**.

---

## 8. Exact Steps to Test the Complete V1 Flow

1. Open `http://localhost:3000` (or deployed URL).
2. Click **Try Scholarship Verification** to navigate to `/scholarship`.
3. Check the pre-filled applicant details:
   - Full Name: `Sai Preetham`
   - Application ID: `SCH-2026-001`
   - Education Qualification: `Bachelor's Degree`
   - Annual Income: `180000`
   - Residence State: `Telangana`
4. Click the prominent button: **Verify Automatically with EKSetu**.
5. Observe the live orchestration progress:
   - *✓ Request created*
   - *✓ Education Department contacted*
   - *✓ Revenue Department contacted*
   - *✓ Residence Department contacted*
   - *✓ Data aggregated*
   - *✓ Verification complete*
6. Review the verification outcome:
   - Request ID generated (e.g. `REQ-20260929-8F42A`)
   - Overall Status: `✓ VERIFIED`
   - 3 Department Cards clearly showing source provenance:
     - Education Department (Qualification: Bachelor's Degree, Status: ✓ Verified)
     - Revenue Department (Annual Income: ₹1,80,000, Status: ✓ Verified)
     - Residence Department (State: Telangana, Status: ✓ Verified)
7. Click **View Request Details** to expand and review the internal interoperability sequence trace.
8. (Optional Demonstration): Switch scenario dropdown to **Simulate Revenue Department Failure** and click verify to showcase `PARTIAL_VERIFIED` handling.
