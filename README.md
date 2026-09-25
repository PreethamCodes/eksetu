# EkSetu — Government Interoperability Platform

> **EkSetu V1 is a prototype demonstrating consent-based interoperability between government services using simulated provider APIs. It does not access real government systems or real citizen data.**

---

## 1. Overview

**EkSetu** is an interoperability layer designed for government public service delivery.

* **Primary Application Title**: EkSetu
* **Tagline**: One Platform. Connected Services.
* **Supporting Description**: Connecting government services through secure, consent-based data exchange.
* **Release Version**: Prototype V1.0 (Smart India Hackathon Prototype)

---

## 2. Problem Being Addressed

In traditional government service delivery, citizens are forced to repeatedly submit the exact same documents (income certificates, educational credentials, caste certificates, address proofs) to different departments. 

* **Citizen burden**: Long physical queues, duplicate paperwork, delayed processing.
* **Administrative overhead**: Manual physical verification of documents across departments.
* **Data silos**: Departments cannot communicate securely with other official data custodians.

### EkSetu Core Solution:
Citizens should not have to repeatedly submit the same information to different government services. **EkSetu acts as an interoperability layer that allows one service to securely request verified information from another connected service/provider, strictly based on citizen consent.**

---

## 3. V1 Objective

Demonstrate one complete, working, end-to-end interoperability flow through actual API calls:

```text
Citizen
   ↓
EkSetu Gateway
   ↓
Select Government Service (Income Certificate)
   ↓
Service Requirements Disclosure
   ↓
Citizen Consent (Explicit Review & Approval)
   ↓
EkSetu API Layer
   ↓
Mock Government Data Provider
   ↓
Data Verification
   ↓
EkSetu Gateway
   ↓
Citizen Result (Verified Data & Audit Log)
```

---

## 4. Architecture & Data Flow

```text
                  EkSetu
                    │
          ┌─────────┴─────────┐
          │                   │
    Service Layer      Interoperability Layer
                              │
                              ↓
                        Provider API
```

* **Frontend**: Next.js App Router UI providing clean GovTech user experiences.
* **EkSetu API Layer**: Orchestrates requests (`/api/request`), records citizen consent (`/api/consent`), and conducts integrity verification (`/api/verify`).
* **Provider Layer**: Decoupled mock provider simulating departmental custodian backends (`/api/provider/income/[citizenId]`).

The frontend **never** queries the data provider directly. All data access occurs through the EkSetu interoperability contract.

---

## 5. Technology Stack

* **Framework**: Next.js 14+ (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **State & Data**: In-Memory Request Store + Local Structured JSON
* **Runtime / Deployment**: Node.js & Vercel serverless compatible

---

## 6. Project Structure

```text
eksetu/
├── app/
│   ├── layout.tsx                              # Root layout with GovTech theme
│   ├── globals.css                             # Tailwind directives
│   ├── page.tsx                                # Landing page with hero & 4 capability cards
│   ├── about/
│   │   └── page.tsx                            # Mission, SIH context, and V1 scope
│   ├── services/
│   │   ├── page.tsx                            # Catalog of services (1 Active, 2 Coming Soon)
│   │   └── income-certificate/
│   │       ├── page.tsx                        # Requirements disclosure & request creation
│   │       └── consent/
│   │           └── page.tsx                    # Citizen consent screen & API submission
│   ├── result/
│   │   └── [requestId]/
│   │       └── page.tsx                        # Verified data card & technical flow diagram
│   └── api/
│       ├── request/
│       │   ├── route.ts                        # POST /api/request
│       │   └── [requestId]/route.ts            # GET /api/request/[requestId]
│       ├── consent/
│       │   └── route.ts                        # POST /api/consent
│       ├── provider/
│       │   └── income/
│       │       └── [citizenId]/route.ts        # GET /api/provider/income/[citizenId]
│       └── verify/
│           └── route.ts                        # POST /api/verify
├── components/
│   ├── Header.tsx                              # Responsive GovTech header
│   ├── Footer.tsx                              # Prototype disclaimers
│   ├── ServiceCard.tsx                         # Service catalog card
│   ├── TechnicalFlow.tsx                       # Step-by-step interoperability diagram
│   └── LoadingOverlay.tsx                      # Professional transition spinner
├── data/
│   ├── services.json                           # Service definitions
│   └── citizens.json                           # Mock departmental citizen records
├── lib/
│   ├── types.ts                                # Core TypeScript data contracts
│   ├── requestStore.ts                         # In-memory ticket cache with resilient fallback
│   ├── dataProvider.ts                         # Decoupled DataProvider adapter interface
│   └── verification.ts                         # Business validation & audit logging
└── README.md
```

---

## 7. API Endpoints

### 1. Initiate Service Request
- **Endpoint**: `POST /api/request`
- **Request Body**:
  ```json
  {
    "service": "income-certificate",
    "citizenId": "CIT-001",
    "purpose": "Income Certificate Application"
  }
  ```
- **Response**:
  ```json
  {
    "requestId": "EK-2026-00001",
    "status": "PENDING"
  }
  ```

### 2. Record Citizen Consent
- **Endpoint**: `POST /api/consent`
- **Request Body**:
  ```json
  {
    "requestId": "EK-2026-00001",
    "consent": true
  }
  ```
- **Response**:
  ```json
  {
    "requestId": "EK-2026-00001",
    "consent": "GRANTED",
    "status": "APPROVED"
  }
  ```

### 3. Query Mock Government Data Provider
- **Endpoint**: `GET /api/provider/income/CIT-001`
- **Response**:
  ```json
  {
    "citizenId": "CIT-001",
    "name": "Rahul Kumar",
    "address": "Hyderabad, Telangana",
    "annualIncome": 450000,
    "verified": true,
    "source": "Government Data Provider — Prototype"
  }
  ```

### 4. Verify Request & Fetch Data
- **Endpoint**: `POST /api/verify`
- **Request Body**:
  ```json
  {
    "requestId": "EK-2026-00001"
  }
  ```
- **Response**:
  ```json
  {
    "requestId": "EK-2026-00001",
    "status": "VERIFIED",
    "data": {
      "name": "Rahul Kumar",
      "address": "Hyderabad, Telangana",
      "annualIncome": 450000
    },
    "source": "Government Data Provider — Prototype",
    "technicalDetails": {
      "requestId": "EK-2026-00001",
      "service": "income-certificate",
      "consent": "GRANTED",
      "provider": "Government Data Provider — Prototype",
      "verification": "SUCCESS",
      "responseStatus": 200
    }
  }
  ```

---

## 8. Local Setup & Running Locally

### Prerequisites
* Node.js v18.17+ or v20+
* npm v9+

### Installation
```bash
git clone https://github.com/your-username/eksetu.git
cd eksetu
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Production Build
```bash
npm run build
npm start
```

---

## 9. Deployment to Vercel

EkSetu is designed for zero-config deployment to Vercel:

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: EkSetu V1 Foundation Prototype"
   git remote add origin https://github.com/<your-username>/EkSetu.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com).
3. Click **Add New Project** and select the **EkSetu** repository.
4. Leave standard settings (Framework: Next.js) and click **Deploy**.
5. Once deployed, you receive your permanent live demo URL:
   `https://eksetu.vercel.app` (or custom subdomain).

---

## 10. Future Roadmap

### V1 — Foundation (Current)
- EkSetu Service Catalog
- Explicit Citizen Consent Flow
- Interoperability API Layer
- Mock Provider Abstraction
- Verified Data Exchange

### V2 — Real Integrations
- Citizen Authentication (OAuth 2.0 / OIDC)
- PostgreSQL persistent audit trails
- Real integration with National API Setu
- DigiLocker document exchange integration
- Live State Department APIs

### V3 — National Scale
- Multi-Department routing
- Dynamic Service Discovery & registry
- Granular data minimization policy engine
- Tamper-proof audit logs
- Inter-agency monitoring & SLA analytics

### V4 — Intelligence
- Citizen conversational discovery interface
- Predictive scheme eligibility mapping
- Seamless multi-benefit packaging
