-- EKSetu PostgreSQL / Supabase Schema (V3: Policy Engine & Data Minimization)

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
    decision VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, GRANTED, DENIED
    consent_type VARCHAR(32) NOT NULL DEFAULT 'ONE_TIME',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. policies table (V3 Policy Engine & Data Minimization Rules)
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id VARCHAR(64) UNIQUE NOT NULL,
    service VARCHAR(64) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT '1.0',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    rules JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. verification_results table
CREATE TABLE IF NOT EXISTS verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) NOT NULL REFERENCES verification_requests(request_id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    data JSONB NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. audit_events table (V4 Verification Provenance & Audit Trail)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(64) NOT NULL REFERENCES verification_requests(request_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    service VARCHAR(64),
    provider VARCHAR(64),
    status VARCHAR(32),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_req_id ON verification_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_consents_req_id ON consents(request_id);
CREATE INDEX IF NOT EXISTS idx_policies_lookup ON policies(service, purpose);
CREATE INDEX IF NOT EXISTS idx_results_req_id ON verification_results(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_request_id ON audit_events(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
