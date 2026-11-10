import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, planSlug, days } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    // 1. Suspend Organization
    if (action === 'suspend') {
      const org = await Repository.suspendOrganization(params.id);
      if (!org) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({ success: true, organization: org, message: 'Organization suspended' });
    }

    // 2. Reactivate Organization
    if (action === 'reactivate') {
      const org = await Repository.reactivateOrganization(params.id);
      if (!org) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({ success: true, organization: org, message: 'Organization reactivated' });
    }

    // 3. Change Plan
    if (action === 'change_plan') {
      if (!planSlug) {
        return NextResponse.json({ success: false, error: 'planSlug is required' }, { status: 400 });
      }
      const result = await Repository.upgradeSubscription(params.id, planSlug);
      return NextResponse.json({ success: true, organization: result.org, message: `Plan updated to ${planSlug}` });
    }

    // 4. Extend Trial
    if (action === 'extend_trial') {
      const extendDays = days ? parseInt(days, 10) : 30;
      const result = await Repository.extendTrial(params.id, extendDays);
      if (!result) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({
        success: true,
        organization: result.org,
        newTrialEnd: result.newTrialEnd,
        message: `Trial extended by ${extendDays} days`,
      });
    }

    // 5. Update Organization Details / Logo
    if (action === 'update' || action === 'update_logo') {
      const { name, admin_name, admin_email, contact_number, slug, status, plan_id, logo_url } = body;

      if (name !== undefined && (!name || !name.trim())) {
        return NextResponse.json({ success: false, error: 'Organization name cannot be empty' }, { status: 400 });
      }

      if (admin_email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(admin_email.trim())) {
          return NextResponse.json({ success: false, error: 'Please enter a valid administrator email address' }, { status: 400 });
        }
      }

      let normalizedPhone: string | undefined = undefined;
      if (contact_number !== undefined) {
        if (contact_number && typeof contact_number === 'string' && contact_number.trim()) {
          const cleanNum = contact_number.trim().replace(/[\s\-\(\)]/g, '');
          const match = cleanNum.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
          if (match) {
            normalizedPhone = `+91${match[1]}`;
          } else {
            normalizedPhone = contact_number.trim();
          }
        } else {
          normalizedPhone = '';
        }
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (admin_name !== undefined) updates.admin_name = admin_name.trim();
      if (admin_email !== undefined) updates.admin_email = admin_email.trim().toLowerCase();
      if (normalizedPhone !== undefined) updates.contact_number = normalizedPhone;
      if (slug !== undefined) updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (status !== undefined) updates.status = status;
      if (plan_id !== undefined) updates.plan_id = plan_id;
      if (logo_url !== undefined) updates.logo_url = logo_url.trim();

      const org = await Repository.updateOrganization(params.id, updates);
      if (!org) return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      return NextResponse.json({ success: true, organization: org, message: 'Organization updated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Unknown Super Admin action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 });
    }

    const deleted = await Repository.deleteOrganization(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
