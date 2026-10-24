/**
 * VocNix Email HTML Templates
 * Responsive, branded dark-mode email layouts matching VocNix's visual identity.
 */

function baseLayout(content: string, previewText: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocNix Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 36px 24px;
      border-bottom: 1px solid #1e293b;
      background: linear-gradient(180deg, #131d35 0%, #0f172a 100%);
    }
    .brand-logo {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin: 0;
    }
    .brand-accent {
      color: #10b981;
    }
    .brand-tagline {
      margin-top: 4px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      font-weight: 600;
    }
    .content {
      padding: 36px;
    }
    .h1 {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 16px;
    }
    .p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 20px;
    }
    .info-box {
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #111827;
      font-size: 13px;
    }
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .btn-container {
      margin: 32px 0 24px;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #020617 !important;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }
    .btn-secondary {
      background-color: #1e293b;
      color: #f1f5f9 !important;
      box-shadow: none;
      border: 1px solid #334155;
    }
    .guidelines {
      background: rgba(15, 23, 42, 0.6);
      border-left: 3px solid #10b981;
      padding: 14px 18px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #cbd5e1;
    }
    .footer {
      padding: 24px 36px;
      border-top: 1px solid #1e293b;
      text-align: center;
      background: #090e1a;
      font-size: 12px;
      color: #475569;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#0b1120;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="email-container">
    <div class="header">
      <a href="https://vocnix.site" class="brand-logo">
        <h1 class="brand-title">Voc<span class="brand-accent">Nix</span></h1>
      </a>
      <div class="brand-tagline">Real-time Human Audio Translation</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} VocNix Platform. All rights reserved.</p>
      <p style="margin: 0;">This is an automated notification from VocNix. If you did not expect this email, please contact support.</p>
    </div>
  </div>
</body>
</html>`;
}

// 1. Password Reset Template
export function getPasswordResetTemplate(params: {
  resetUrl: string;
  recipientName?: string;
}): { subject: string; html: string; text: string } {
  const name = params.recipientName || 'VocNix User';
  const subject = 'Reset Your VocNix Password';
  const html = baseLayout(
    `
    <h2 class="h1">Reset Your Password</h2>
    <p class="p">Hello ${name},</p>
    <p class="p">We received a request to reset your password for your VocNix account. Click the button below to choose a new password.</p>
    
    <div class="btn-container">
      <a href="${params.resetUrl}" class="btn" target="_blank">Reset Password</a>
    </div>

    <div class="info-box">
      <p class="p" style="margin-bottom: 8px; font-size: 12px; color: #94a3b8;">Or copy and paste this link into your browser:</p>
      <p class="mono" style="font-size: 11px; word-break: break-all; color: #38bdf8; margin: 0;">
        ${params.resetUrl}
      </p>
    </div>

    <p class="p" style="font-size: 12px; color: #64748b;">
      This password reset link is valid for 1 hour. If you did not make this request, you can safely ignore this email; your account remains secure.
    </p>
    `,
    'Password reset link for your VocNix account'
  );

  const text = `Hello ${name},\n\nWe received a request to reset your password. Use the link below to choose a new password:\n\n${params.resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.`;

  return { subject, html, text };
}

// 2. Event Translator Assignment Template
export function getTranslatorAssignmentTemplate(params: {
  translatorName: string;
  eventTitle: string;
  languageName: string;
  roomUrl: string;
  scheduledStart?: string;
  orgName?: string;
}): { subject: string; html: string; text: string } {
  const dateFormatted = params.scheduledStart
    ? new Date(params.scheduledStart).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : 'Live Session Scheduled';

  const subject = `Translation Assignment: ${params.languageName} for "${params.eventTitle}"`;
  const html = baseLayout(
    `
    <div style="margin-bottom: 12px;">
      <span class="badge">Live Translator Assignment</span>
    </div>
    <h2 class="h1">You're Assigned to Translate</h2>
    <p class="p">Hello ${params.translatorName},</p>
    <p class="p">
      You have been assigned as the human translator for <strong>${params.eventTitle}</strong>${params.orgName ? ` hosted by <strong>${params.orgName}</strong>` : ''}.
    </p>

    <div class="info-box">
      <table style="width: 100%;">
        <tr>
          <td class="info-label" style="padding: 6px 0;">Event:</td>
          <td class="info-value" style="padding: 6px 0;">${params.eventTitle}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Language Channel:</td>
          <td class="info-value" style="padding: 6px 0; color: #34d399;">${params.languageName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Scheduled Start:</td>
          <td class="info-value" style="padding: 6px 0;">${dateFormatted}</td>
        </tr>
      </table>
    </div>

    <div class="guidelines">
      <strong>Translator Checklist:</strong>
      <ul style="margin: 6px 0 0; padding-left: 18px;">
        <li>Use a desktop or laptop running Chrome, Brave, or Firefox.</li>
        <li>Connect a wired headset or microphone to avoid acoustic feedback.</li>
        <li>Join the booth 5 minutes before scheduled start time.</li>
      </ul>
    </div>

    <div class="btn-container">
      <a href="${params.roomUrl}" class="btn" target="_blank">Enter Translator Booth</a>
    </div>

    <div class="info-box">
      <p class="p" style="margin-bottom: 8px; font-size: 12px; color: #94a3b8;">Direct Booth Access Link (No login required):</p>
      <p class="mono" style="font-size: 11px; word-break: break-all; color: #38bdf8; margin: 0;">
        ${params.roomUrl}
      </p>
    </div>
    `,
    `You are assigned to translate ${params.languageName} for ${params.eventTitle}`
  );

  const text = `Hello ${params.translatorName},\n\nYou have been assigned as translator for "${params.eventTitle}" (${params.languageName}).\n\nScheduled Start: ${dateFormatted}\n\nDirect Booth Access Link:\n${params.roomUrl}\n\nPlease join 5 minutes early with a headset.`;

  return { subject, html, text };
}

// 3. Organization Admin Welcome Template
export function getOrganizationWelcomeTemplate(params: {
  adminName: string;
  orgName: string;
  adminEmail: string;
  username?: string;
  temporaryPassword?: string;
  loginUrl: string;
  planName?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to VocNix: Your Organization "${params.orgName}" is Ready`;
  const html = baseLayout(
    `
    <div style="margin-bottom: 12px;">
      <span class="badge">Organization Provisioned</span>
    </div>
    <h2 class="h1">Welcome to VocNix Platform</h2>
    <p class="p">Hello ${params.adminName},</p>
    <p class="p">
      Your organization <strong>${params.orgName}</strong> has been created on VocNix${params.planName ? ` with the <strong>${params.planName}</strong> plan` : ''}.
      You are designated as the Organization Administrator.
    </p>

    <div class="info-box">
      <table style="width: 100%;">
        <tr>
          <td class="info-label" style="padding: 6px 0;">Organization:</td>
          <td class="info-value" style="padding: 6px 0;">${params.orgName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Admin Email:</td>
          <td class="info-value" style="padding: 6px 0;">${params.adminEmail}</td>
        </tr>
        ${params.username ? `
        <tr>
          <td class="info-label" style="padding: 6px 0;">Username:</td>
          <td class="info-value mono" style="padding: 6px 0;">${params.username}</td>
        </tr>` : ''}
        ${params.temporaryPassword ? `
        <tr>
          <td class="info-label" style="padding: 6px 0;">Initial Password:</td>
          <td class="info-value mono" style="padding: 6px 0; color: #f59e0b;">${params.temporaryPassword}</td>
        </tr>` : ''}
      </table>
    </div>

    <div class="btn-container">
      <a href="${params.loginUrl}" class="btn" target="_blank">Sign In to Admin Portal</a>
    </div>

    <p class="p" style="font-size: 12px; color: #64748b;">
      For security reasons, please log in and update your password immediately after first sign in.
    </p>
    `,
    `Welcome to VocNix! Your organization ${params.orgName} has been created.`
  );

  const text = `Hello ${params.adminName},\n\nYour organization "${params.orgName}" has been provisioned on VocNix.\n\nSign in to your admin portal:\nURL: ${params.loginUrl}\nEmail: ${params.adminEmail}${params.username ? `\nUsername: ${params.username}` : ''}${params.temporaryPassword ? `\nTemporary Password: ${params.temporaryPassword}` : ''}\n\nPlease update your password after logging in.`;

  return { subject, html, text };
}

// 4. Translator Roster Welcome Template
export function getTranslatorInviteTemplate(params: {
  translatorName: string;
  orgName?: string;
  nativeLanguages: string[];
}): { subject: string; html: string; text: string } {
  const langs = params.nativeLanguages.length > 0 ? params.nativeLanguages.join(', ').toUpperCase() : 'General';
  const subject = `Welcome to the Translator Team${params.orgName ? ` at ${params.orgName}` : ''}`;
  const html = baseLayout(
    `
    <div style="margin-bottom: 12px;">
      <span class="badge">Translator Roster</span>
    </div>
    <h2 class="h1">Welcome to the Translation Roster</h2>
    <p class="p">Hello ${params.translatorName},</p>
    <p class="p">
      You have been registered as an authorized human translator${params.orgName ? ` for <strong>${params.orgName}</strong>` : ''} on the VocNix live translation platform.
    </p>

    <div class="info-box">
      <table style="width: 100%;">
        <tr>
          <td class="info-label" style="padding: 6px 0;">Translator Name:</td>
          <td class="info-value" style="padding: 6px 0;">${params.translatorName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Registered Languages:</td>
          <td class="info-value" style="padding: 6px 0; color: #34d399;">${langs}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Status:</td>
          <td class="info-value" style="padding: 6px 0; color: #10b981;">Active</td>
        </tr>
      </table>
    </div>

    <p class="p">
      Whenever you are assigned to a live translation channel, you will receive an email containing a secure 1-click access link directly into your translation booth. No separate account or password is required.
    </p>
    `,
    `You are registered as a human translator for ${params.orgName || 'VocNix'}`
  );

  const text = `Hello ${params.translatorName},\n\nYou have been registered as a human translator on VocNix (${langs}). When assigned to an event, you will receive a direct access link to your booth.`;

  return { subject, html, text };
}

// 5. User Provisioned Template (Super Admin or Platform Admin)
export function getUserProvisionedTemplate(params: {
  fullName: string;
  username: string;
  email: string;
  role: string;
  temporaryPassword?: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const roleName = params.role === 'super_admin' ? 'Super Admin' : 'Admin';
  const subject = `Your VocNix ${roleName} Account Has Been Created`;
  const html = baseLayout(
    `
    <div style="margin-bottom: 12px;">
      <span class="badge">${roleName} Access</span>
    </div>
    <h2 class="h1">Account Provisioned</h2>
    <p class="p">Hello ${params.fullName},</p>
    <p class="p">
      A <strong>${roleName}</strong> account has been provisioned for you on the VocNix platform.
    </p>

    <div class="info-box">
      <table style="width: 100%;">
        <tr>
          <td class="info-label" style="padding: 6px 0;">Role:</td>
          <td class="info-value" style="padding: 6px 0; color: #38bdf8;">${roleName}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Username:</td>
          <td class="info-value mono" style="padding: 6px 0;">${params.username}</td>
        </tr>
        <tr>
          <td class="info-label" style="padding: 6px 0;">Email:</td>
          <td class="info-value" style="padding: 6px 0;">${params.email}</td>
        </tr>
        ${params.temporaryPassword ? `
        <tr>
          <td class="info-label" style="padding: 6px 0;">Initial Password:</td>
          <td class="info-value mono" style="padding: 6px 0; color: #f59e0b;">${params.temporaryPassword}</td>
        </tr>` : ''}
      </table>
    </div>

    <div class="btn-container">
      <a href="${params.loginUrl}" class="btn" target="_blank">Sign In Now</a>
    </div>
    `,
    `Your VocNix ${roleName} account credentials`
  );

  const text = `Hello ${params.fullName},\n\nYour VocNix ${roleName} account has been provisioned.\nUsername: ${params.username}\nEmail: ${params.email}${params.temporaryPassword ? `\nPassword: ${params.temporaryPassword}` : ''}\nLogin: ${params.loginUrl}`;

  return { subject, html, text };
}
