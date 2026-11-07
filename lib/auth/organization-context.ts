import { NextRequest } from 'next/server';
import { getSessionFromRequest, IMPERSONATION_COOKIE_NAME, UserSession } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { Organization } from '@/lib/types/database';

export interface ResolvedOrganizationContext {
  organization: Organization;
  isImpersonating: boolean;
  superAdmin?: UserSession | null;
}

/**
 * Resolves the target Organization for an incoming request.
 * - If Super Admin is impersonating (via cookie, param, or header), returns the impersonated organization.
 * - If Organization Admin, strictly returns their own authorized organization (isolated from others).
 * - Fallbacks to default organization.
 */
export async function resolveRequestOrganization(req: NextRequest): Promise<Organization> {
  const context = await resolveOrganizationContext(req);
  return context.organization;
}

export async function resolveOrganizationContext(req: NextRequest): Promise<ResolvedOrganizationContext> {
  const session = await getSessionFromRequest(req);

  // 1. Super Admin: can impersonate any tenant organization
  if (session?.role === 'super_admin') {
    const impersonateCookie = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
    const queryOrgId = req.nextUrl?.searchParams?.get('orgId') || undefined;
    const headerOrgId = req.headers.get('x-organization-id') || undefined;
    const targetOrgId = impersonateCookie || queryOrgId || headerOrgId;

    if (targetOrgId) {
      const org = await Repository.getOrganization(targetOrgId);
      if (org) {
        return {
          organization: org,
          isImpersonating: true,
          superAdmin: session,
        };
      }
    }

    const defaultOrg = (await Repository.getDefaultOrganization()) || ({ id: '', name: 'No Organization', slug: 'none', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Organization);
    return {
      organization: defaultOrg,
      isImpersonating: false,
      superAdmin: session,
    };
  }

  // 2. Organization Admin: strictly locked to their own organization
  if (session?.role === 'admin') {
    const adminOrg = await Repository.getOrganizationForAdmin(session.userId, session.email);
    if (adminOrg) {
      return {
        organization: adminOrg,
        isImpersonating: false,
      };
    }
    const defaultOrg = (await Repository.getDefaultOrganization()) || ({ id: '', name: 'No Organization', slug: 'none', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Organization);
    return {
      organization: defaultOrg,
      isImpersonating: false,
    };
  }

  // 3. Fallback / Public
  const defaultOrg = (await Repository.getDefaultOrganization()) || ({ id: '', name: 'No Organization', slug: 'none', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Organization);
  return {
    organization: defaultOrg,
    isImpersonating: false,
  };
}
