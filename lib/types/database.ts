export type EventStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'expired';
export type RoomStatus = 'idle' | 'live' | 'paused' | 'ended';
export type SessionStatus = 'live' | 'paused' | 'stopped';
export type MemberRole = 'owner' | 'admin' | 'translator' | 'viewer';
export type OrgStatus = 'active' | 'suspended' | 'delinquent';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  max_events: number;
  max_concurrent_rooms: number;
  monthly_minute_quota: number;
  price_cents: number;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_id?: string;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: EventStatus;
  public_access_token: string;
  created_at: string;
  updated_at: string;
}

export interface EventLanguage {
  id: string;
  event_id: string;
  language_code: string;
  language_name: string;
  created_at: string;
}

export interface TranslationRoom {
  id: string;
  event_id: string;
  event_language_id: string;
  livekit_room_name: string;
  secure_room_token: string;
  status: RoomStatus;
  active_listener_count: number;
  created_at: string;
  updated_at: string;
}

export interface Translator {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  native_languages: string[];
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TranslatorAssignment {
  id: string;
  translation_room_id: string;
  translator_id: string;
  assigned_at: string;
}

export interface TranslatorSession {
  id: string;
  translation_room_id: string;
  translator_id?: string;
  status: SessionStatus;
  started_at: string;
  paused_at?: string;
  ended_at?: string;
  duration_seconds: number;
  created_at: string;
}

export interface AudienceSession {
  id: string;
  translation_room_id: string;
  session_key: string;
  joined_at: string;
  left_at?: string;
  ip_hash?: string;
  user_agent?: string;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  organization_id: string;
  event_id?: string;
  translation_room_id?: string;
  translator_session_id?: string;
  minutes_used: number;
  recorded_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  organization_id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
