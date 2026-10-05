-- Sugar CRM integration: OAuth token storage and application linkage

CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'sugar',
    username TEXT NOT NULL,
    platform TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT account_provider_username_platform_key UNIQUE (provider, username, platform)
);

CREATE INDEX IF NOT EXISTS idx_account_provider ON account (provider);

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS sugar_logic_interaction_id TEXT;

CREATE INDEX IF NOT EXISTS idx_application_sugar_logic_interaction_id
    ON application (sugar_logic_interaction_id)
    WHERE sugar_logic_interaction_id IS NOT NULL;

ALTER TABLE account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_service"
    ON account
    FOR ALL
    USING (auth.role() = 'service_role');
