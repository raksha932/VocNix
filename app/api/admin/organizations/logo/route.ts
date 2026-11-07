import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
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
    // 1. Authorize: Super Admin or Admin can upload organization logo
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'super_admin' && session.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin or Organization Admin access required.' },
        { status: 403 }
      );
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('logo') as File | null || formData.get('file') as File | null;
    let orgId = (formData.get('orgId') as string | null)?.trim() || null;

    if (!orgId && session.role === 'admin') {
      const adminOrg = await Repository.getOrganizationForAdmin(session.userId, session.email);
      const defaultOrg = await Repository.getDefaultOrganization();
      orgId = adminOrg?.id || defaultOrg?.id || null;
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No logo file provided. Please choose an image to upload.' },
        { status: 400 }
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum limit of 5MB. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    // 4. Validate file type
    const mimeType = file.type.toLowerCase();
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
    const fileName = `logo_${orgId || 'new'}_${Date.now()}_${randomBytes(4).toString('hex')}${ext}`;

    let logoUrl = '';

    // 5. Attempt upload to Supabase Storage
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
            console.warn('[LogoUpload] Supabase Storage upload warning:', uploadErr.message);
          }
        } catch (supabaseErr: any) {
          console.warn('[LogoUpload] Supabase Storage exception:', supabaseErr.message);
        }
      }
    }

    // 6. Fallback to local public disk storage or base64 data URI if Supabase storage was unavailable
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
        console.warn('[LogoUpload] Disk save fallback warning:', diskErr.message);
        // Fallback to Base64 data URL
        logoUrl = `data:${effectiveMime};base64,${fileBuffer.toString('base64')}`;
      }
    }

    // 7. If orgId is provided, update organization record immediately
    if (orgId) {
      const updatedOrg = await Repository.updateOrganization(orgId, { logo_url: logoUrl });
      if (!updatedOrg) {
        console.warn(`[LogoUpload] Organization with id ${orgId} not found to attach logo.`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Organization logo uploaded successfully.',
      logo_url: logoUrl,
      fileName,
    });
  } catch (err: any) {
    console.error('[API /api/admin/organizations/logo POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to upload organization logo.' },
      { status: 500 }
    );
  }
}
