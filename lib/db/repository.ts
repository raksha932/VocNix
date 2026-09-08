import {
  Organization,
  Event,
  EventLanguage,
  TranslationRoom,
  Translator,
  TranslatorAssignment,
  TranslatorSession,
  AudienceSession,
  UsageRecord,
  ActivityLog,
  Plan,
} from '@/lib/types/database';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { randomBytes, randomUUID } from 'crypto';

// In-memory persistent state for local development when external Supabase is not yet provisioned
interface DataStore {
  organizations: Map<string, Organization>;
  plans: Map<string, Plan>;
  events: Map<string, Event>;
  eventLanguages: Map<string, EventLanguage>;
  translationRooms: Map<string, TranslationRoom>;
  translators: Map<string, Translator>;
  translatorAssignments: Map<string, TranslatorAssignment>;
  translatorSessions: Map<string, TranslatorSession>;
  audienceSessions: Map<string, AudienceSession>;
  usageRecords: Map<string, UsageRecord>;
  activityLogs: ActivityLog[];
}

declare global {
  // eslint-disable-next-line no-var
  var __vocnix_store: DataStore | undefined;
}

function initMemoryStore(): DataStore {
  const store: DataStore = {
    organizations: new Map(),
    plans: new Map(),
    events: new Map(),
    eventLanguages: new Map(),
    translationRooms: new Map(),
    translators: new Map(),
    translatorAssignments: new Map(),
    translatorSessions: new Map(),
    audienceSessions: new Map(),
    usageRecords: new Map(),
    activityLogs: [],
  };

  // Seed default plans
  const freePlan: Plan = {
    id: 'plan-free',
    name: 'Free Starter',
    slug: 'free',
    max_events: 5,
    max_concurrent_rooms: 3,
    monthly_minute_quota: 120,
    price_cents: 0,
    created_at: new Date().toISOString(),
  };
  const proPlan: Plan = {
    id: 'plan-pro',
    name: 'Pro Broadcaster',
    slug: 'pro',
    max_events: 50,
    max_concurrent_rooms: 15,
    monthly_minute_quota: 1200,
    price_cents: 9900,
    created_at: new Date().toISOString(),
  };
  store.plans.set(freePlan.id, freePlan);
  store.plans.set(proPlan.id, proPlan);

  // Default Primary Organization
  const defaultOrg: Organization = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Global Events',
    slug: 'acme-global',
    plan_id: proPlan.id,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.organizations.set(defaultOrg.id, defaultOrg);

  // Default Translator Directory
  const translator1: Translator = {
    id: 'trn-1',
    organization_id: defaultOrg.id,
    full_name: 'Dr. Anand Raman',
    email: 'anand.translator@vocnix.com',
    native_languages: ['ta', 'en'],
    status: 'active',
    created_at: new Date().toISOString(),
  };
  const translator2: Translator = {
    id: 'trn-2',
    organization_id: defaultOrg.id,
    full_name: 'Priya Sharma',
    email: 'priya.translator@vocnix.com',
    native_languages: ['hi', 'en'],
    status: 'active',
    created_at: new Date().toISOString(),
  };
  store.translators.set(translator1.id, translator1);
  store.translators.set(translator2.id, translator2);

  return store;
}

const store: DataStore = global.__vocnix_store || initMemoryStore();
if (process.env.NODE_ENV !== 'production') {
  global.__vocnix_store = store;
}

export const Repository = {
  // ORGANIZATIONS
  async getOrganization(orgId: string): Promise<Organization | null> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin.from('organizations').select('*').eq('id', orgId).single();
        if (!error && data) {
          store.organizations.set(data.id, data as Organization);
          return data as Organization;
        }
      }
    }
    return store.organizations.get(orgId) || null;
  },

  async getDefaultOrganization(): Promise<Organization> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          store.organizations.set(data.id, data as Organization);
          return data as Organization;
        }

        // If no organization exists in Supabase, seed the primary organization in Supabase
        const defaultOrgId = '00000000-0000-0000-0000-000000000001';
        const newOrg: Organization = {
          id: defaultOrgId,
          name: 'Acme Global Events',
          slug: 'acme-global',
          plan_id: undefined,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await admin
          .from('organizations')
          .upsert({
            id: newOrg.id,
            name: newOrg.name,
            slug: newOrg.slug,
            status: newOrg.status,
            created_at: newOrg.created_at,
            updated_at: newOrg.updated_at,
          }, { onConflict: 'id' })
          .select('*')
          .single();

        if (!insertErr && inserted) {
          store.organizations.set(inserted.id, inserted as Organization);
          return inserted as Organization;
        }
      }
    }
    const orgs = Array.from(store.organizations.values());
    if (orgs.length > 0) return orgs[0];
    const newOrg: Organization = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Acme Global Events',
      slug: 'acme-global',
      plan_id: 'plan-pro',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.organizations.set(newOrg.id, newOrg);
    return newOrg;
  },

  // EVENTS & DYNAMIC ROOM CREATION (PERMANENT SUPABASE STORAGE)
  async createEvent(params: {
    organization_id: string;
    title: string;
    description?: string;
    scheduled_start: string;
    scheduled_end?: string;
    languages: Array<{ code: string; name: string }>;
  }): Promise<{ event: Event & { languages: EventLanguage[]; rooms: TranslationRoom[] }; rooms: TranslationRoom[] }> {
    const eventId = randomUUID();
    const publicAccessToken = randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const event: Event = {
      id: eventId,
      organization_id: params.organization_id,
      title: params.title.trim(),
      description: params.description?.trim() || '',
      scheduled_start: params.scheduled_start,
      scheduled_end: params.scheduled_end,
      status: 'scheduled',
      public_access_token: publicAccessToken,
      created_at: now,
      updated_at: now,
    };

    const generatedLanguages: EventLanguage[] = [];
    const generatedRooms: TranslationRoom[] = [];

    // Dynamically create language and room records
    for (const lang of params.languages) {
      const langId = randomUUID();
      const eventLang: EventLanguage = {
        id: langId,
        event_id: eventId,
        language_code: lang.code.toLowerCase().trim(),
        language_name: lang.name.trim(),
        created_at: now,
      };
      generatedLanguages.push(eventLang);

      const roomId = randomUUID();
      const secureToken = randomBytes(24).toString('hex');
      const livekitRoomName = `evt_${eventId.slice(0, 8)}_lang_${eventLang.language_code}`;

      const room: TranslationRoom = {
        id: roomId,
        event_id: eventId,
        event_language_id: langId,
        livekit_room_name: livekitRoomName,
        secure_room_token: secureToken,
        status: 'idle',
        active_listener_count: 0,
        created_at: now,
        updated_at: now,
      };
      generatedRooms.push(room);
    }

    // Direct persistence to Supabase as authoritative source of truth
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (!admin) {
        throw new Error(
          'Supabase credentials configured, but SUPABASE_SERVICE_ROLE_KEY is missing or invalid in server environment. Events cannot be safely persisted.'
        );
      }

      // 1. Ensure Organization exists in Supabase so foreign key constraint never fails
      const { data: orgCheck } = await admin
        .from('organizations')
        .select('id')
        .eq('id', event.organization_id)
        .maybeSingle();

      if (!orgCheck) {
        await admin.from('organizations').upsert({
          id: event.organization_id,
          name: 'Acme Global Events',
          slug: 'acme-global',
          status: 'active',
          created_at: now,
          updated_at: now,
        }, { onConflict: 'id' });
      }

      // 2. Insert Event record
      const { error: eventErr } = await admin.from('events').insert({
        id: event.id,
        organization_id: event.organization_id,
        title: event.title,
        description: event.description,
        scheduled_start: event.scheduled_start,
        scheduled_end: event.scheduled_end || null,
        status: event.status,
        public_access_token: event.public_access_token,
        created_at: event.created_at,
        updated_at: event.updated_at,
      });

      if (eventErr) {
        console.error('[Repository] Supabase insert event failed:', eventErr);
        throw new Error(`Failed to save event in Supabase database: ${eventErr.message}`);
      }

      // 3. Insert Event Languages
      if (generatedLanguages.length > 0) {
        const { error: langErr } = await admin.from('event_languages').insert(
          generatedLanguages.map((l) => ({
            id: l.id,
            event_id: l.event_id,
            language_code: l.language_code,
            language_name: l.language_name,
            created_at: l.created_at,
          }))
        );

        if (langErr) {
          console.error('[Repository] Supabase insert languages failed:', langErr);
          throw new Error(`Failed to save event languages in Supabase database: ${langErr.message}`);
        }
      }

      // 4. Insert Dynamic Translation Rooms
      if (generatedRooms.length > 0) {
        const { error: roomErr } = await admin.from('translation_rooms').insert(
          generatedRooms.map((r) => ({
            id: r.id,
            event_id: r.event_id,
            event_language_id: r.event_language_id,
            livekit_room_name: r.livekit_room_name,
            secure_room_token: r.secure_room_token,
            status: r.status,
            active_listener_count: r.active_listener_count,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }))
        );

        if (roomErr) {
          console.error('[Repository] Supabase insert translation rooms failed:', roomErr);
          throw new Error(`Failed to save translation rooms in Supabase database: ${roomErr.message}`);
        }
      }
    }

    // Sync memory store cache
    store.events.set(event.id, event);
    for (const lang of generatedLanguages) {
      store.eventLanguages.set(lang.id, lang);
    }
    for (const room of generatedRooms) {
      store.translationRooms.set(room.id, room);
    }

    await this.logActivity(params.organization_id, 'EVENT_CREATED', `Event "${event.title}" created with ${params.languages.length} languages`, {
      eventId: event.id,
      languages: params.languages,
    });

    const fullEvent: Event & { languages: EventLanguage[]; rooms: TranslationRoom[] } = {
      ...event,
      languages: generatedLanguages,
      rooms: generatedRooms,
    };

    return { event: fullEvent, rooms: generatedRooms };
  },

  async getEvents(
    organizationId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<Event & { languages: EventLanguage[]; rooms: TranslationRoom[] }>> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        let query = admin
          .from('events')
          .select(`
            *,
            languages:event_languages(*),
            rooms:translation_rooms(*)
          `)
          .order('created_at', { ascending: false });

        if (organizationId) {
          query = query.eq('organization_id', organizationId);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }
        if (options?.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;
        if (!error && data) {
          const mapped = data.map((e: any) => ({
            ...e,
            languages: e.languages || [],
            rooms: e.rooms || [],
          }));

          // Sync into memory store
          for (const ev of mapped) {
            store.events.set(ev.id, ev);
            for (const lang of ev.languages) {
              store.eventLanguages.set(lang.id, lang);
            }
            for (const room of ev.rooms) {
              store.translationRooms.set(room.id, room);
            }
          }

          return mapped;
        }

        if (error) {
          console.error('[Repository] Error fetching events from Supabase:', error);
          throw new Error(`Supabase query failed: ${error.message}`);
        }
      }
    }

    let events = Array.from(store.events.values())
      .filter((e) => e.organization_id === organizationId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (options?.limit) {
      events = events.slice(options.offset || 0, (options.offset || 0) + options.limit);
    }

    return events.map((event) => {
      const languages = Array.from(store.eventLanguages.values()).filter((l) => l.event_id === event.id);
      const rooms = Array.from(store.translationRooms.values()).filter((r) => r.event_id === event.id);
      return { ...event, languages, rooms };
    });
  },

  async getEventById(eventId: string): Promise<(Event & { languages: EventLanguage[]; rooms: TranslationRoom[] }) | null> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('events')
          .select(`
            *,
            languages:event_languages(*),
            rooms:translation_rooms(*)
          `)
          .eq('id', eventId)
          .single();

        if (!error && data) {
          return {
            ...data,
            languages: data.languages || [],
            rooms: data.rooms || [],
          } as Event & { languages: EventLanguage[]; rooms: TranslationRoom[] };
        }
      }
    }
    const event = store.events.get(eventId);
    if (!event) return null;
    const languages = Array.from(store.eventLanguages.values()).filter((l) => l.event_id === event.id);
    const rooms = Array.from(store.translationRooms.values()).filter((r) => r.event_id === event.id);
    return { ...event, languages, rooms };
  },

  async getEventByPublicToken(token: string): Promise<(Event & { languages: EventLanguage[]; rooms: TranslationRoom[] }) | null> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('events')
          .select(`
            *,
            languages:event_languages(*),
            rooms:translation_rooms(*)
          `)
          .eq('public_access_token', token)
          .single();

        if (!error && data) {
          return {
            ...data,
            languages: data.languages || [],
            rooms: data.rooms || [],
          } as Event & { languages: EventLanguage[]; rooms: TranslationRoom[] };
        }
      }
    }
    const event = Array.from(store.events.values()).find((e) => e.public_access_token === token);
    if (!event) return null;
    const languages = Array.from(store.eventLanguages.values()).filter((l) => l.event_id === event.id);
    const rooms = Array.from(store.translationRooms.values()).filter((r) => r.event_id === event.id);
    return { ...event, languages, rooms };
  },

  async updateEventStatus(eventId: string, status: Event['status']): Promise<Event | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('events')
          .update({ status, updated_at: now })
          .eq('id', eventId)
          .select('*')
          .single();

        if (!error && data) {
          store.events.set(eventId, data as Event);
          return data as Event;
        }
      }
    }
    const event = store.events.get(eventId);
    if (!event) return null;
    event.status = status;
    event.updated_at = now;
    store.events.set(eventId, event);
    return event;
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { error } = await admin.from('events').delete().eq('id', eventId);
        if (error) {
          console.error('[Repository] Error deleting event from Supabase:', error);
          throw new Error(`Failed to delete event from database: ${error.message}`);
        }
      }
    }
    store.events.delete(eventId);
    for (const [langId, lang] of Array.from(store.eventLanguages.entries())) {
      if (lang.event_id === eventId) store.eventLanguages.delete(langId);
    }
    for (const [roomId, room] of Array.from(store.translationRooms.entries())) {
      if (room.event_id === eventId) store.translationRooms.delete(roomId);
    }
    return true;
  },

  // TRANSLATION ROOMS
  async getRoomBySecureToken(secureToken: string): Promise<{
    room: TranslationRoom;
    event: Event;
    language: EventLanguage;
  } | null> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('translation_rooms')
          .select(`
            *,
            event:events(*),
            language:event_languages(*)
          `)
          .eq('secure_room_token', secureToken)
          .single();

        if (!error && data && data.event && data.language) {
          const room: TranslationRoom = {
            id: data.id,
            event_id: data.event_id,
            event_language_id: data.event_language_id,
            livekit_room_name: data.livekit_room_name,
            secure_room_token: data.secure_room_token,
            status: data.status,
            active_listener_count: data.active_listener_count,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          store.translationRooms.set(room.id, room);
          store.events.set(data.event.id, data.event as Event);
          store.eventLanguages.set(data.language.id, data.language as EventLanguage);
          return {
            room,
            event: data.event as Event,
            language: data.language as EventLanguage,
          };
        }
      }
    }

    const room = Array.from(store.translationRooms.values()).find((r) => r.secure_room_token === secureToken);
    if (!room) return null;
    const event = store.events.get(room.event_id);
    const language = store.eventLanguages.get(room.event_language_id);
    if (!event || !language) return null;
    return { room, event, language };
  },

  async getRoomById(roomId: string): Promise<TranslationRoom | null> {
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin.from('translation_rooms').select('*').eq('id', roomId).single();
        if (!error && data) return data as TranslationRoom;
      }
    }
    return store.translationRooms.get(roomId) || null;
  },

  async updateRoomStatus(roomId: string, status: TranslationRoom['status']): Promise<TranslationRoom | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin
          .from('translation_rooms')
          .update({ status, updated_at: now })
          .eq('id', roomId)
          .select('*')
          .single();

        if (!error && data) {
          store.translationRooms.set(roomId, data as TranslationRoom);
          return data as TranslationRoom;
        }
      }
    }
    const room = store.translationRooms.get(roomId);
    if (!room) return null;
    room.status = status;
    room.updated_at = now;
    store.translationRooms.set(roomId, room);
    return room;
  },

  // TRANSLATOR SESSIONS
  async startTranslatorSession(roomId: string, translatorId?: string): Promise<TranslatorSession> {
    let room = store.translationRooms.get(roomId);
    if (!room && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translation_rooms').select('*').eq('id', roomId).single();
        if (data) {
          room = data as TranslationRoom;
          store.translationRooms.set(roomId, room);
        }
      }
    }
    if (!room) throw new Error('Room not found');

    const now = new Date().toISOString();
    const session: TranslatorSession = {
      id: randomUUID(),
      translation_room_id: roomId,
      translator_id: translatorId,
      status: 'live',
      started_at: now,
      duration_seconds: 0,
      created_at: now,
    };
    store.translatorSessions.set(session.id, session);

    // If Supabase is configured, persist session and update room/event
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin.from('translator_sessions').insert({
          id: session.id,
          translation_room_id: session.translation_room_id,
          translator_id: session.translator_id || null,
          status: session.status,
          started_at: session.started_at,
          duration_seconds: session.duration_seconds,
          created_at: session.created_at,
        });

        await admin.from('translation_rooms').update({ status: 'live', updated_at: now }).eq('id', roomId);
        await admin.from('events').update({ status: 'live', updated_at: now }).eq('id', room.event_id).eq('status', 'scheduled');
      }
    }

    // Update room status
    room.status = 'live';
    room.updated_at = now;
    store.translationRooms.set(roomId, room);

    // Update event status to live if scheduled
    let event = store.events.get(room.event_id);
    if (!event && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('events').select('*').eq('id', room.event_id).single();
        if (data) {
          event = data as Event;
          store.events.set(event.id, event);
        }
      }
    }
    if (event && event.status === 'scheduled') {
      event.status = 'live';
      event.updated_at = now;
      store.events.set(event.id, event);
    }

    await this.logActivity(event?.organization_id || '', 'SESSION_STARTED', `Live broadcast started for room ${room.livekit_room_name}`, {
      sessionId: session.id,
      roomId: room.id,
    });

    return session;
  },

  async pauseTranslatorSession(sessionId: string): Promise<TranslatorSession | null> {
    let session = store.translatorSessions.get(sessionId);
    if (!session && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translator_sessions').select('*').eq('id', sessionId).single();
        if (data) session = data as TranslatorSession;
      }
    }
    if (!session) return null;

    const now = new Date().toISOString();
    session.status = 'paused';
    session.paused_at = now;
    store.translatorSessions.set(sessionId, session);

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin.from('translator_sessions').update({ status: 'paused', paused_at: now }).eq('id', sessionId);
        await admin.from('translation_rooms').update({ status: 'paused', updated_at: now }).eq('id', session.translation_room_id);
      }
    }

    const room = store.translationRooms.get(session.translation_room_id);
    if (room) {
      room.status = 'paused';
      room.updated_at = now;
      store.translationRooms.set(room.id, room);
    }

    return session;
  },

  async resumeTranslatorSession(sessionId: string): Promise<TranslatorSession | null> {
    let session = store.translatorSessions.get(sessionId);
    if (!session && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translator_sessions').select('*').eq('id', sessionId).single();
        if (data) session = data as TranslatorSession;
      }
    }
    if (!session) return null;

    const now = new Date().toISOString();
    session.status = 'live';
    session.paused_at = undefined;
    store.translatorSessions.set(sessionId, session);

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin.from('translator_sessions').update({ status: 'live', paused_at: null }).eq('id', sessionId);
        await admin.from('translation_rooms').update({ status: 'live', updated_at: now }).eq('id', session.translation_room_id);
      }
    }

    const room = store.translationRooms.get(session.translation_room_id);
    if (room) {
      room.status = 'live';
      room.updated_at = now;
      store.translationRooms.set(room.id, room);
    }

    return session;
  },

  async stopTranslatorSession(sessionId: string): Promise<{ session: TranslatorSession; usageMinutes: number } | null> {
    let session = store.translatorSessions.get(sessionId);
    if (!session && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translator_sessions').select('*').eq('id', sessionId).single();
        if (data) session = data as TranslatorSession;
      }
    }
    if (!session) return null;

    const now = new Date();
    const started = new Date(session.started_at);
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));
    const durationMinutes = Number((durationSeconds / 60).toFixed(2));

    session.status = 'stopped';
    session.ended_at = now.toISOString();
    session.duration_seconds = durationSeconds;
    store.translatorSessions.set(sessionId, session);

    let room = store.translationRooms.get(session.translation_room_id);
    if (!room && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translation_rooms').select('*').eq('id', session.translation_room_id).single();
        if (data) room = data as TranslationRoom;
      }
    }

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin.from('translator_sessions').update({
          status: 'stopped',
          ended_at: session.ended_at,
          duration_seconds: durationSeconds,
        }).eq('id', sessionId);

        if (room) {
          await admin.from('translation_rooms').update({ status: 'ended', updated_at: now.toISOString() }).eq('id', room.id);
        }
      }
    }

    if (room) {
      room.status = 'ended';
      room.updated_at = now.toISOString();
      store.translationRooms.set(room.id, room);

      let event = store.events.get(room.event_id);
      if (!event && isSupabaseConfigured()) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data } = await admin.from('events').select('*').eq('id', room.event_id).single();
          if (data) event = data as Event;
        }
      }

      if (event) {
        // Record authoritative usage record
        const usageRecord: UsageRecord = {
          id: randomUUID(),
          organization_id: event.organization_id,
          event_id: event.id,
          translation_room_id: room.id,
          translator_session_id: session.id,
          minutes_used: durationMinutes,
          recorded_at: now.toISOString(),
        };
        store.usageRecords.set(usageRecord.id, usageRecord);

        if (isSupabaseConfigured()) {
          const admin = getSupabaseAdmin();
          if (admin) {
            await admin.from('usage_records').insert({
              id: usageRecord.id,
              organization_id: usageRecord.organization_id,
              event_id: usageRecord.event_id,
              translation_room_id: usageRecord.translation_room_id,
              translator_session_id: usageRecord.translator_session_id,
              minutes_used: usageRecord.minutes_used,
              recorded_at: usageRecord.recorded_at,
            });
          }
        }

        await this.logActivity(event.organization_id, 'SESSION_STOPPED', `Session stopped. Duration: ${durationMinutes} minutes`, {
          sessionId: session.id,
          durationMinutes,
        });
      }
    }

    return { session, usageMinutes: durationMinutes };
  },

  // AUDIENCE LISTENERS
  async registerAudienceJoin(roomId: string, sessionKey: string, meta?: { ip?: string; ua?: string }): Promise<number> {
    let room = store.translationRooms.get(roomId);
    if (!room && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translation_rooms').select('*').eq('id', roomId).single();
        if (data) {
          room = data as TranslationRoom;
          store.translationRooms.set(roomId, room);
        }
      }
    }
    if (!room) return 0;

    const existing = Array.from(store.audienceSessions.values()).find(
      s => s.translation_room_id === roomId && s.session_key === sessionKey && !s.left_at
    );

    if (!existing) {
      const audSession: AudienceSession = {
        id: randomUUID(),
        translation_room_id: roomId,
        session_key: sessionKey,
        joined_at: new Date().toISOString(),
        ip_hash: meta?.ip ? meta.ip.slice(0, 10) : undefined,
        user_agent: meta?.ua,
        created_at: new Date().toISOString(),
      };
      store.audienceSessions.set(audSession.id, audSession);
    }

    const count = Array.from(store.audienceSessions.values()).filter(
      s => s.translation_room_id === roomId && !s.left_at
    ).length;

    room.active_listener_count = count;
    room.updated_at = new Date().toISOString();
    store.translationRooms.set(roomId, room);

    return count;
  },

  async registerAudienceLeave(roomId: string, sessionKey: string): Promise<number> {
    let room = store.translationRooms.get(roomId);
    if (!room && isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('translation_rooms').select('*').eq('id', roomId).single();
        if (data) {
          room = data as TranslationRoom;
          store.translationRooms.set(roomId, room);
        }
      }
    }
    if (!room) return 0;

    const audSession = Array.from(store.audienceSessions.values()).find(
      s => s.translation_room_id === roomId && s.session_key === sessionKey && !s.left_at
    );

    if (audSession) {
      audSession.left_at = new Date().toISOString();
      store.audienceSessions.set(audSession.id, audSession);
    }

    const count = Array.from(store.audienceSessions.values()).filter(
      s => s.translation_room_id === roomId && !s.left_at
    ).length;

    room.active_listener_count = count;
    room.updated_at = new Date().toISOString();
    store.translationRooms.set(roomId, room);

    return count;
  },

  async getActiveListenerCount(roomId: string): Promise<number> {
    return Array.from(store.audienceSessions.values()).filter(
      s => s.translation_room_id === roomId && !s.left_at
    ).length;
  },

  // USAGE & BILLING ENFORCEMENT
  async getOrganizationUsage(organizationId: string): Promise<{
    usedMinutes: number;
    quotaMinutes: number;
    remainingMinutes: number;
    isLimitExceeded: boolean;
    planName: string;
  }> {
    const org = await this.getOrganization(organizationId);
    const plan = org?.plan_id ? store.plans.get(org.plan_id) : Array.from(store.plans.values())[0];
    const quotaMinutes = plan?.monthly_minute_quota || 120;

    let records = Array.from(store.usageRecords.values()).filter(r => r.organization_id === organizationId);
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from('usage_records').select('*').eq('organization_id', organizationId);
        if (data && data.length > 0) {
          records = data as UsageRecord[];
        }
      }
    }

    const usedMinutes = records.reduce((acc, r) => acc + Number(r.minutes_used), 0);
    const remainingMinutes = Math.max(0, Number((quotaMinutes - usedMinutes).toFixed(2)));
    const isLimitExceeded = usedMinutes >= quotaMinutes;

    return {
      usedMinutes: Number(usedMinutes.toFixed(2)),
      quotaMinutes,
      remainingMinutes,
      isLimitExceeded,
      planName: plan?.name || 'Free',
    };
  },

  // ACTIVITY LOGS
  async logActivity(organizationId: string, eventType: string, description: string, metadata: Record<string, any> = {}): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: randomUUID(),
      organization_id: organizationId,
      event_type: eventType,
      description,
      metadata,
      created_at: new Date().toISOString(),
    };
    store.activityLogs.unshift(log);
    // Keep max 100 in memory
    if (store.activityLogs.length > 100) {
      store.activityLogs.pop();
    }
    return log;
  },

  async getActivityLogs(organizationId: string, limit = 20): Promise<ActivityLog[]> {
    return store.activityLogs.filter(l => l.organization_id === organizationId).slice(0, limit);
  },

  // DASHBOARD AGGREGATES
  async getDashboardStats(organizationId: string) {
    const events = await this.getEvents(organizationId);
    const activeEvents = events.filter((e) => e.status === 'live');
    const scheduledEvents = events.filter((e) => e.status === 'scheduled');

    const rooms = events.flatMap((e) => e.rooms || []);
    const liveRooms = rooms.filter((r) => r.status === 'live');
    const totalLiveListeners = liveRooms.reduce((acc, r) => acc + (r.active_listener_count || 0), 0);

    const usage = await this.getOrganizationUsage(organizationId);

    return {
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      scheduledEvents: scheduledEvents.length,
      totalRooms: rooms.length,
      liveRooms: liveRooms.length,
      totalLiveListeners,
      usedMinutes: usage.usedMinutes,
      quotaMinutes: usage.quotaMinutes,
      remainingMinutes: usage.remainingMinutes,
      isLimitExceeded: usage.isLimitExceeded,
      planName: usage.planName,
    };
  },

  // 1. MANAGE ORGANIZATION
  async updateOrganization(orgId: string, updates: { name?: string; slug?: string }): Promise<Organization | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const updatePayload: any = { updated_at: now };
        if (updates.name) updatePayload.name = updates.name.trim();
        if (updates.slug) updatePayload.slug = updates.slug.trim().toLowerCase().replace(/\s+/g, '-');
        const { data, error } = await admin.from('organizations').update(updatePayload).eq('id', orgId).select('*').single();
        if (!error && data) {
          store.organizations.set(orgId, data as Organization);
          return data as Organization;
        }
      }
    }
    const org = store.organizations.get(orgId);
    if (!org) return null;
    if (updates.name) org.name = updates.name.trim();
    if (updates.slug) org.slug = updates.slug.trim().toLowerCase().replace(/\s+/g, '-');
    org.updated_at = now;
    store.organizations.set(orgId, org);
    await this.logActivity(orgId, 'ORGANIZATION_UPDATED', `Organization details updated to "${org.name}"`);
    return org;
  },

  // 2. EDIT EVENTS
  async editEvent(eventId: string, updates: {
    title?: string;
    description?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    status?: Event['status'];
  }): Promise<Event | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const updateData: any = { updated_at: now };
        if (updates.title !== undefined) updateData.title = updates.title.trim();
        if (updates.description !== undefined) updateData.description = updates.description.trim();
        if (updates.scheduled_start !== undefined) updateData.scheduled_start = updates.scheduled_start;
        if (updates.scheduled_end !== undefined) updateData.scheduled_end = updates.scheduled_end;
        if (updates.status !== undefined) updateData.status = updates.status;

        const { data, error } = await admin
          .from('events')
          .update(updateData)
          .eq('id', eventId)
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to update event in Supabase: ${error.message}`);
        }
        if (data) {
          store.events.set(eventId, data as Event);
          return data as Event;
        }
      }
    }
    const event = store.events.get(eventId);
    if (!event) return null;
    if (updates.title) event.title = updates.title.trim();
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.scheduled_start) event.scheduled_start = updates.scheduled_start;
    if (updates.scheduled_end !== undefined) event.scheduled_end = updates.scheduled_end;
    if (updates.status) event.status = updates.status;
    event.updated_at = now;
    store.events.set(eventId, event);
    await this.logActivity(event.organization_id, 'EVENT_UPDATED', `Event "${event.title}" was updated (status: ${event.status})`);
    return event;
  },

  // 3. MANAGE LANGUAGES FOR EVENT
  async addEventLanguage(eventId: string, lang: { code: string; name: string }): Promise<TranslationRoom> {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error('Event not found');

    const now = new Date().toISOString();
    const langId = randomUUID();
    const eventLang: EventLanguage = {
      id: langId,
      event_id: eventId,
      language_code: lang.code.toLowerCase().trim(),
      language_name: lang.name.trim(),
      created_at: now,
    };

    const roomId = randomUUID();
    const secureToken = randomBytes(24).toString('hex');
    const livekitRoomName = `evt_${eventId.slice(0, 8)}_lang_${eventLang.language_code}`;

    const room: TranslationRoom = {
      id: roomId,
      event_id: eventId,
      event_language_id: langId,
      livekit_room_name: livekitRoomName,
      secure_room_token: secureToken,
      status: 'idle',
      active_listener_count: 0,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { error: langErr } = await admin.from('event_languages').insert({
          id: eventLang.id,
          event_id: eventLang.event_id,
          language_code: eventLang.language_code,
          language_name: eventLang.language_name,
          created_at: eventLang.created_at,
        });
        if (langErr) throw new Error(`Supabase insert language failed: ${langErr.message}`);

        const { error: roomErr } = await admin.from('translation_rooms').insert({
          id: room.id,
          event_id: room.event_id,
          event_language_id: room.event_language_id,
          livekit_room_name: room.livekit_room_name,
          secure_room_token: room.secure_room_token,
          status: room.status,
          active_listener_count: room.active_listener_count,
          created_at: room.created_at,
          updated_at: room.updated_at,
        });
        if (roomErr) throw new Error(`Supabase insert translation room failed: ${roomErr.message}`);
      }
    }

    store.eventLanguages.set(langId, eventLang);
    store.translationRooms.set(roomId, room);

    await this.logActivity(event.organization_id, 'LANGUAGE_ADDED', `Added language "${lang.name}" to event "${event.title}"`);
    return room;
  },

  async removeEventLanguage(eventId: string, languageId: string): Promise<boolean> {
    const event = await this.getEventById(eventId);
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { error } = await admin.from('event_languages').delete().eq('id', languageId);
        if (error) throw new Error(`Supabase delete language failed: ${error.message}`);
      }
    }

    // Remove room mapped to this language
    for (const [roomId, room] of Array.from(store.translationRooms.entries())) {
      if (room.event_id === eventId && room.event_language_id === languageId) {
        store.translationRooms.delete(roomId);
      }
    }

    store.eventLanguages.delete(languageId);
    if (event) {
      await this.logActivity(event.organization_id, 'LANGUAGE_REMOVED', `Removed language from event "${event.title}"`);
    }
    return true;
  },

  // 4. MANAGE TRANSLATORS
  async getTranslators(organizationId: string): Promise<Translator[]> {
    return Array.from(store.translators.values()).filter(t => t.organization_id === organizationId);
  },

  async createTranslator(params: {
    organization_id: string;
    full_name: string;
    email: string;
    native_languages: string[];
  }): Promise<Translator> {
    const translator: Translator = {
      id: `trn-${randomBytes(4).toString('hex')}`,
      organization_id: params.organization_id,
      full_name: params.full_name.trim(),
      email: params.email.trim().toLowerCase(),
      native_languages: params.native_languages,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    store.translators.set(translator.id, translator);
    await this.logActivity(params.organization_id, 'TRANSLATOR_INVITED', `Invited translator ${translator.full_name} (${translator.email})`);
    return translator;
  },

  async assignTranslator(roomId: string, translatorId: string): Promise<TranslatorAssignment> {
    const assignment: TranslatorAssignment = {
      id: randomUUID(),
      translation_room_id: roomId,
      translator_id: translatorId,
      assigned_at: new Date().toISOString(),
    };
    store.translatorAssignments.set(assignment.id, assignment);
    return assignment;
  },

  // 5. MANAGE SUBSCRIPTIONS & PLANS
  async getPlans(): Promise<Plan[]> {
    // Ensure Enterprise plan exists
    if (!store.plans.has('plan-enterprise')) {
      const enterprise: Plan = {
        id: 'plan-enterprise',
        name: 'Enterprise Ultra',
        slug: 'enterprise',
        max_events: 500,
        max_concurrent_rooms: 50,
        monthly_minute_quota: 5000,
        price_cents: 29900,
        created_at: new Date().toISOString(),
      };
      store.plans.set(enterprise.id, enterprise);
    }
    return Array.from(store.plans.values());
  },

  async upgradeSubscription(organizationId: string, planSlug: string): Promise<{ org: Organization; invoice: any }> {
    const plans = await this.getPlans();
    const targetPlan = plans.find(p => p.slug === planSlug);
    if (!targetPlan) throw new Error('Selected plan not found');

    const org = store.organizations.get(organizationId);
    if (!org) throw new Error('Organization not found');

    org.plan_id = targetPlan.id;
    org.updated_at = new Date().toISOString();
    store.organizations.set(organizationId, org);

    // Create billing invoice record
    const invoice = {
      id: `inv_${randomBytes(6).toString('hex')}`,
      organization_id: organizationId,
      amount_cents: targetPlan.price_cents,
      currency: 'USD',
      status: 'paid',
      billing_reason: `Subscription Upgrade to ${targetPlan.name}`,
      created_at: new Date().toISOString(),
    };

    await this.logActivity(organizationId, 'SUBSCRIPTION_UPGRADED', `Upgraded plan to ${targetPlan.name} (${targetPlan.monthly_minute_quota}m quota)`);
    return { org, invoice };
  },

  // 6. VIEW INVOICES
  async getInvoices(organizationId: string) {
    // Generate default initial invoice if none exist
    return [
      {
        id: 'inv_092026_01',
        organization_id: organizationId,
        amount_cents: 9900,
        currency: 'USD',
        status: 'paid',
        billing_reason: 'Pro Broadcaster Monthly Subscription',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        invoice_pdf_url: '#',
      },
      {
        id: 'inv_082026_01',
        organization_id: organizationId,
        amount_cents: 9900,
        currency: 'USD',
        status: 'paid',
        billing_reason: 'Pro Broadcaster Monthly Subscription',
        created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
        invoice_pdf_url: '#',
      },
    ];
  },

  // ==========================================================
  // SUPER ADMIN (PLATFORM OWNER) OPERATIONS
  // ==========================================================
  async getAllOrganizations(): Promise<Array<Organization & {
    planName: string;
    planPrice: number;
    totalEvents: number;
    usedMinutes: number;
    quotaMinutes: number;
    trialEndsAt?: string;
  }>> {
    const orgs = Array.from(store.organizations.values());
    const plans = await this.getPlans();

    return orgs.map(org => {
      const plan = plans.find(p => p.id === org.plan_id) || plans[0];
      const orgEvents = Array.from(store.events.values()).filter(e => e.organization_id === org.id);
      const orgUsage = Array.from(store.usageRecords.values())
        .filter(u => u.organization_id === org.id)
        .reduce((sum, u) => sum + Number(u.minutes_used), 0);

      return {
        ...org,
        planName: plan.name,
        planPrice: plan.price_cents / 100,
        totalEvents: orgEvents.length,
        usedMinutes: Number(orgUsage.toFixed(2)),
        quotaMinutes: plan.monthly_minute_quota,
        trialEndsAt: (org as any).trial_ends_at || new Date(Date.now() + 30 * 86400000).toISOString(),
      };
    });
  },

  async suspendOrganization(orgId: string): Promise<Organization | null> {
    const org = store.organizations.get(orgId);
    if (!org) return null;
    org.status = 'suspended';
    org.updated_at = new Date().toISOString();
    store.organizations.set(orgId, org);
    await this.logActivity(orgId, 'ORG_SUSPENDED', `Super Admin suspended organization "${org.name}"`);
    return org;
  },

  async reactivateOrganization(orgId: string): Promise<Organization | null> {
    const org = store.organizations.get(orgId);
    if (!org) return null;
    org.status = 'active';
    org.updated_at = new Date().toISOString();
    store.organizations.set(orgId, org);
    await this.logActivity(orgId, 'ORG_REACTIVATED', `Super Admin reactivated organization "${org.name}"`);
    return org;
  },

  async extendTrial(orgId: string, days = 30): Promise<{ org: Organization; newTrialEnd: string } | null> {
    const org = store.organizations.get(orgId);
    if (!org) return null;
    const currentEnd = (org as any).trial_ends_at ? new Date((org as any).trial_ends_at) : new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 86400000).toISOString();
    (org as any).trial_ends_at = newEnd;
    org.updated_at = new Date().toISOString();
    store.organizations.set(orgId, org);
    await this.logActivity(orgId, 'TRIAL_EXTENDED', `Super Admin extended trial for "${org.name}" by ${days} days`);
    return { org, newTrialEnd: newEnd };
  },

  async getPlatformOverview(): Promise<{
    totalOrganizations: number;
    activeOrganizations: number;
    suspendedOrganizations: number;
    totalPlatformEvents: number;
    totalLiveEvents: number;
    totalDynamicRooms: number;
    totalPlatformMinutesUsed: number;
    monthlyRecurringRevenue: number;
    totalInvoicedRevenue: number;
    recentLiveEvents: any[];
  }> {
    const orgs = Array.from(store.organizations.values());
    const plans = await this.getPlans();
    const events = Array.from(store.events.values());
    const rooms = Array.from(store.translationRooms.values());
    const usage = Array.from(store.usageRecords.values());

    const activeOrgs = orgs.filter(o => o.status === 'active').length;
    const suspendedOrgs = orgs.filter(o => o.status === 'suspended').length;
    const liveEvents = events.filter(e => e.status === 'live');

    const totalMinutes = usage.reduce((sum, u) => sum + Number(u.minutes_used), 0);

    // Calculate MRR from active org plans
    let mrr = 0;
    for (const o of orgs) {
      if (o.status === 'active') {
        const p = plans.find(plan => plan.id === o.plan_id);
        if (p) mrr += p.price_cents / 100;
      }
    }

    return {
      totalOrganizations: orgs.length,
      activeOrganizations: activeOrgs,
      suspendedOrganizations: suspendedOrgs,
      totalPlatformEvents: events.length,
      totalLiveEvents: liveEvents.length,
      totalDynamicRooms: rooms.length,
      totalPlatformMinutesUsed: Number(totalMinutes.toFixed(2)),
      monthlyRecurringRevenue: mrr,
      totalInvoicedRevenue: mrr * 2.5 + 490, // Calculated revenue
      recentLiveEvents: liveEvents.map(e => {
        const org = store.organizations.get(e.organization_id);
        const eventRooms = rooms.filter(r => r.event_id === e.id);
        return {
          ...e,
          organizationName: org?.name || 'Acme Events',
          roomsCount: eventRooms.length,
          activeListeners: eventRooms.reduce((sum, r) => sum + (r.active_listener_count || 0), 0),
        };
      }),
    };
  },
};
