-- Migration: 20260930000001_create_audit_events.sql
-- EKSetu V4: Verification Provenance & Audit Trail

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

CREATE INDEX IF NOT EXISTS idx_audit_events_request_id ON audit_events(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
