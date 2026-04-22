-- ============================================================
-- 003_otp_verifications.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT otp_verifications_user_id_unique UNIQUE (user_id)
);

CREATE INDEX idx_otp_user_id ON otp_verifications(user_id);
CREATE INDEX idx_otp_expires_at ON otp_verifications(expires_at);

ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Service role full access (used by API routes)
CREATE POLICY "Service role full access otp"
    ON otp_verifications FOR ALL
    USING (auth.role() = 'service_role');
