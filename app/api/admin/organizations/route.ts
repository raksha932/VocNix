import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { isResendConfigured, sendOrganizationWelcomeEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const organizations = await Repository.getAllOrganizations();
    const plans = await Repository.getPlans();
    return NextResponse.json({ success: true, organizations, plans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize: Only authenticated Super Admin can create organizations
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only authenticated Super Admins can create new organizations.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, slug, admin_name, admin_email, contact_number, status, plan_id } = body;

    // 2. Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required.' },
        { status: 400 }
      );
    }

    if (!admin_email || typeof admin_email !== 'string' || !admin_email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization administrator email is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid administrator email address (e.g. name@domain.com).' },
        { status: 400 }
      );
    }

    // 3. Create organization with admin account integration & duplicate validation
    const result = await Repository.createOrganization({
      name: name.trim(),
      slug: slug?.trim() || undefined,
      admin_name: admin_name?.trim() || undefined,
      admin_email: admin_email.trim().toLowerCase(),
      contact_number: contact_number?.trim() || undefined,
      status: status === 'inactive' ? 'inactive' : 'active',
      plan_id: plan_id || undefined,
    });

    // 4. Dispatch onboarding email to the organization administrator via Resend
    if (isResendConfigured()) {
      const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const plans = await Repository.getPlans();
      const plan = plans.find((p) => p.id === result.organization.plan_id);

      sendOrganizationWelcomeEmail({
        to: admin_email.trim().toLowerCase(),
        adminName: admin_name?.trim() || result.organization.name + ' Administrator',
        orgName: result.organization.name,
        username: result.adminUser?.username,
        temporaryPassword: 'Admin123!',
        loginUrl: `${redirectOrigin}/login/admin`,
        planName: plan?.name,
      }).catch((err) => {
        console.warn('[AdminOrganizations] Welcome email dispatch warning:', err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Organization "${result.organization.name}" and administrator account created successfully.`,
        organization: result.organization,
        adminUser: result.adminUser
          ? {
              id: result.adminUser.id,
              username: result.adminUser.username,
              email: result.adminUser.email,
              full_name: result.adminUser.full_name,
              role: result.adminUser.role,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/admin/organizations POST] Error:', err);
    const message = err.message || 'Failed to create organization';
    const isConflict = message.toLowerCase().includes('already exists') || message.toLowerCase().includes('already assigned');

    return NextResponse.json(
      { success: false, error: message },
      { status: isConflict ? 409 : 400 }
    );
  }
}
