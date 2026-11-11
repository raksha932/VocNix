-- ====================================================================
-- 005_organization_admin_fields.sql
-- Persist organization administrator details, plan slug, and trial dates
-- in Supabase organizations & profiles tables.
-- ====================================================================

-- 1. Extend organizations table with admin & subscription metadata
ALTER TABLE IF EXISTS public.organizations
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_slug TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Extend profiles table with organization linkage, phone, and status
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 3. Performance indexes for admin & organization lookups
CREATE INDEX IF NOT EXISTS idx_organizations_admin_email ON public.organizations (LOWER(admin_email));
CREATE INDEX IF NOT EXISTS idx_organizations_admin_user_id ON public.organizations (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_profile_id ON public.organization_members (profile_id);

-- 4. Backfill organization admin metadata from existing organization_members / profiles if present
UPDATE public.organizations o
SET
  admin_user_id = COALESCE(o.admin_user_id, p.id),
  admin_name = COALESCE(o.admin_name, p.full_name),
  admin_email = COALESCE(o.admin_email, p.email),
  contact_number = COALESCE(o.contact_number, p.phone)
FROM public.organization_members om
JOIN public.profiles p ON p.id = om.profile_id
WHERE om.organization_id = o.id
  AND om.role IN ('admin', 'owner')
  AND (o.admin_email IS NULL OR o.admin_user_id IS NULL);
