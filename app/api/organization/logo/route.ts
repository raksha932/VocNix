import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { resolveRequestOrganization } from '@/lib/auth/organization-context';
import { Repository } from '@/lib/db/repository';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize: User must be authenticated as admin or super_admin
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required.' },
        { status: 403 }
      );
    }

    // 2. Resolve organization for this request
    const org = await resolveRequestOrganization(req);
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Target organization not found.' },
        { status: 404 }
      );
    }

    // 3. Parse uploaded file
    const formData = await req.formData();
    const file = (formData.get('logo') as File | null) || (formData.get('file') as File | null);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No logo file provided. Please select an image.' },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Logo image exceeds maximum allowed size of 5MB.' },
        { status: 400 }
      );
    }

    // 5. Validate file format
    const mimeType = (file.type || '').toLowerCase();
    const originalName = file.name || 'logo.png';
    const ext = path.extname(originalName).toLowerCase() || '.png';

    const isValidMime = ALLOWED_MIME_TYPES.includes(mimeType);
    const isValidExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PNG, JPG, JPEG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    const effectiveMime = isValidMime ? mimeType : (ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `logo_${org.id}_${Date.now()}_${randomBytes(4).toString('hex')}${ext}`;

    let logoUrl = '';

    // 6. Attempt upload to Supabase Storage
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        try {
          const bucketName = 'organization-logos';

          // Ensure bucket exists
          try {
            await admin.storage.createBucket(bucketName, { public: true });
          } catch {
            // Bucket might already exist, continue
          }

          const { data: uploadData, error: uploadErr } = await admin.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: effectiveMime,
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: publicData } = admin.storage.from(bucketName).getPublicUrl(uploadData.path || fileName);
            if (publicData?.publicUrl) {
              logoUrl = publicData.publicUrl;
            }
          } else if (uploadErr) {
            console.warn('[OrgLogoUpload] Supabase Storage upload error:', uploadErr.message);
          }
        } catch (supabaseErr: any) {
          console.warn('[OrgLogoUpload] Supabase Storage exception:', supabaseErr?.message || supabaseErr);
        }
      }
    }

    // 7. Fallback to public disk storage or Base64 data URL
    if (!logoUrl) {
      try {
        const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
        if (!fs.existsSync(publicUploadsDir)) {
          fs.mkdirSync(publicUploadsDir, { recursive: true });
        }
        const diskPath = path.join(publicUploadsDir, fileName);
        fs.writeFileSync(diskPath, fileBuffer);
        logoUrl = `/uploads/logos/${fileName}`;
      } catch (diskErr: any) {
        console.warn('[OrgLogoUpload] Disk save fallback error:', diskErr?.message || diskErr);
        logoUrl = `data:${effectiveMime};base64,${fileBuffer.toString('base64')}`;
      }
    }

    // 8. Permanently update organization in database
    const updated = await Repository.updateOrganization(org.id, { logo_url: logoUrl });

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      organization: updated,
      message: 'Organization logo updated successfully.',
    });
  } catch (err: any) {
    console.error('[API /api/organization/logo] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to upload organization logo.' },
      { status: 500 }
    );
  }
}
