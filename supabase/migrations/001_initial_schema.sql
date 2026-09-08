-- ==========================================================
-- VOCNIX PRODUCTION DATABASE SCHEMA
-- Multi-tenant real-time human audio translation platform
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLANS (Tier specifications and billing quotas)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'Free', 'Pro', 'Enterprise'
    slug TEXT NOT NULL UNIQUE,
    max_events INT NOT NULL DEFAULT 5,
    max_concurrent_rooms INT NOT NULL DEFAULT 3,
    monthly_minute_quota INT NOT NULL DEFAULT 300,
    price_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORGANIZATIONS (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'delinquent'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORGANIZATION MEMBERS (Role-based access control)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin', -- 'owner', 'admin', 'translator', 'viewer'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- 5. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'draft', 'scheduled', 'live', 'ended', 'expired'
    public_access_token TEXT NOT NULL UNIQUE, -- Secure token for audience: /listen/[token]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EVENT LANGUAGES (Dynamic languages per event)
CREATE TABLE IF NOT EXISTS event_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL, -- e.g. 'ta', 'hi', 'fr', 'en', 'es'
    language_name TEXT NOT NULL, -- e.g. 'Tamil', 'Hindi', 'French'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, language_code)
);

-- 8. TRANSLATION ROOMS (1:1 with dynamic event language)
CREATE TABLE IF NOT EXISTS translation_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_language_id UUID NOT NULL REFERENCES event_languages(id) ON DELETE CASCADE,
    livekit_room_name TEXT NOT NULL UNIQUE, -- e.g. 'evt_xyz_lang_ta'
    secure_room_token TEXT NOT NULL UNIQUE, -- Used for /translator/room/[secure_room_token]
    status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'live', 'paused', 'ended'
    active_listener_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TRANSLATORS (Master translator directory)
CREATE TABLE IF NOT EXISTS translators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    native_languages TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TRANSLATOR ASSIGNMENTS
CREATE TABLE IF NOT EXISTS translator_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_room_id UUID NOT NULL REFERENCES translation_rooms(id) ON DELETE CASCADE,
    translator_id UUID NOT NULL REFERENCES translators(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(translation_room_id, translator_id)
);

-- 11. TRANSLATOR SESSIONS (Authoritative broadcast lifecycle)
CREATE TABLE IF NOT EXISTS translator_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_room_id UUID NOT NULL REFERENCES translation_rooms(id) ON DELETE CASCADE,
    translator_id UUID REFERENCES translators(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'live', -- 'live', 'paused', 'stopped'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AUDIENCE SESSIONS (Tracks real listener connections)
CREATE TABLE IF NOT EXISTS audience_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_room_id UUID NOT NULL REFERENCES translation_rooms(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL, -- Unique participant session ID
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. USAGE RECORDS (Authoritative translation minute tracking)
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    translation_room_id UUID REFERENCES translation_rooms(id) ON DELETE SET NULL,
    translator_session_id UUID REFERENCES translator_sessions(id) ON DELETE SET NULL,
    minutes_used NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'paid', -- 'draft', 'open', 'paid', 'uncollectible'
    billing_reason TEXT NOT NULL,
    invoice_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ACTIVITY LOGS (Immutable audit log)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'EVENT_CREATED', 'TRANSLATOR_CONNECTED', 'SESSION_STARTED', etc.
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- INDEXES FOR PRODUCTION QUERY PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_token ON events(public_access_token);
CREATE INDEX IF NOT EXISTS idx_event_languages_event_id ON event_languages(event_id);
CREATE INDEX IF NOT EXISTS idx_translation_rooms_event_id ON translation_rooms(event_id);
CREATE INDEX IF NOT EXISTS idx_translation_rooms_token ON translation_rooms(secure_room_token);
CREATE INDEX IF NOT EXISTS idx_translator_sessions_room ON translator_sessions(translation_room_id);
CREATE INDEX IF NOT EXISTS idx_audience_sessions_room ON audience_sessions(translation_room_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE translator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Note: In production Supabase, RLS policies check auth.uid() against organization_members.
-- The backend API routes use the secure service role key to authenticate requests.
