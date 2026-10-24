import fs from 'fs';
import path from 'path';
import {
  getPasswordResetTemplate,
  getTranslatorAssignmentTemplate,
  getOrganizationWelcomeTemplate,
  getTranslatorInviteTemplate,
  getUserProvisionedTemplate,
} from './templates';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

let cachedApiKey: string | null = null;

export function getResendApiKey(): string | null {
  if (cachedApiKey) return cachedApiKey;

  // 1. Check environment variable
  const envKey = process.env.RESEND_API_KEY?.trim();
  if (envKey && envKey.startsWith('re_')) {
    cachedApiKey = envKey;
    return cachedApiKey;
  }

  // 2. Fall back to reading infra/.resend-email-key
  try {
    const keyPath = path.join(process.cwd(), 'infra', '.resend-email-key');
    if (fs.existsSync(keyPath)) {
      const fileKey = fs.readFileSync(keyPath, 'utf8').trim();
      if (fileKey && fileKey.startsWith('re_')) {
        cachedApiKey = fileKey;
        return cachedApiKey;
      }
    }
  } catch (err) {
    console.warn('[Resend] Could not read fallback key file:', err);
  }

  return null;
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}

export function getDefaultSender(): string {
  return process.env.EMAIL_FROM || 'VocNix <noreply@vocnix.site>';
}

/**
 * Low-level method to send an email via Resend REST API
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    const warnMsg = '[Resend] Email not sent: RESEND_API_KEY is not configured in environment or infra/.resend-email-key';
    console.warn(warnMsg);
    return { success: false, error: 'Email service is not configured.' };
  }

  const from = options.from || getDefaultSender();
  const to = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Resend API returned status ${res.status}`;
      console.error('[Resend Error]:', errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`[Resend] Successfully dispatched email "${options.subject}" to ${to.join(', ')} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[Resend Exception]:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}

// =========================================================================
// HIGH-LEVEL EMAIL DISPATCHERS
// =========================================================================

/**
 * 1. Password Reset Email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  recipientName?: string;
}): Promise<EmailResult> {
  const { subject, html, text } = getPasswordResetTemplate(params);
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * 2. Event Translator Live Booth Assignment
 */
export async function sendTranslatorAssignmentEmail(params: {
  to: string;
  translatorName: string;
  eventTitle: string;
  languageName: string;
  roomUrl: string;
  scheduledStart?: string;
  orgName?: string;
}): Promise<EmailResult> {
  const { subject, html, text } = getTranslatorAssignmentTemplate(params);
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * 3. Organization Provisioning & Admin Welcome
 */
export async function sendOrganizationWelcomeEmail(params: {
  to: string;
  adminName: string;
  orgName: string;
  username?: string;
  temporaryPassword?: string;
  loginUrl: string;
  planName?: string;
}): Promise<EmailResult> {
  const { subject, html, text } = getOrganizationWelcomeTemplate({
    ...params,
    adminEmail: params.to,
  });
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * 4. Translator Roster Welcome / Invite
 */
export async function sendTranslatorInviteEmail(params: {
  to: string;
  translatorName: string;
  orgName?: string;
  nativeLanguages: string[];
}): Promise<EmailResult> {
  const { subject, html, text } = getTranslatorInviteTemplate(params);
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * 5. Direct User Provisioned Email
 */
export async function sendUserProvisionedEmail(params: {
  to: string;
  fullName: string;
  username: string;
  role: string;
  temporaryPassword?: string;
  loginUrl: string;
}): Promise<EmailResult> {
  const { subject, html, text } = getUserProvisionedTemplate({
    ...params,
    email: params.to,
  });
  return sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}
