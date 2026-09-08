'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  Radio,
  Users,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Globe,
  AlertCircle,
  Headphones,
  Mic,
  Calendar,
  Layers,
  QrCode,
  Edit,
  Trash2,
  Building,
  UserCheck,
  CreditCard,
  FileText,
  Sparkles,
  Settings,
  Search,
  Filter,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import QRCodeModal from '@/components/QRCodeModal';

const COMMON_LANGUAGES = [
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Mandarin' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request sequencing ref to prevent stale in-flight responses from overwriting new state
  const requestIdRef = useRef(0);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'events' | 'translators' | 'billing' | 'organization'>('events');

  // Events Search & History State
  const [viewAllEvents, setViewAllEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'live' | 'ended'>('all');

  // QR Code Modal State
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Create Event Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<Array<{ code: string; name: string }>>([
    { code: 'ta', name: 'Tamil' },
    { code: 'hi', name: 'Hindi' },
  ]);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');

  // Translators State
  const [translators, setTranslators] = useState<any[]>([]);
  const [isInviteTranslatorOpen, setIsInviteTranslatorOpen] = useState(false);
  const [translatorName, setTranslatorName] = useState('');
  const [translatorEmail, setTranslatorEmail] = useState('');
  const [translatorLangs, setTranslatorLangs] = useState('');

  // Billing & Invoices State
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Organization Settings State
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    const reqId = ++requestIdRef.current;
    try {
      setError(null);
      const [statsRes, eventsRes, orgRes] = await Promise.all([
        fetch('/api/dashboard/stats', { cache: 'no-store' }),
        fetch('/api/events?all=true', { cache: 'no-store' }),
        fetch('/api/organization', { cache: 'no-store' }),
      ]);

      const statsData = await statsRes.json();
      const eventsData = await eventsRes.json();
      const orgDataRes = await orgRes.json();

      // Guard: Discard if a newer request was dispatched
      if (reqId !== requestIdRef.current) return;

      if (statsData.success) {
        setStats(statsData.stats);
        setActivityLogs(statsData.activityLogs || []);
      }
      if (eventsData.success) {
        setEvents(eventsData.events || []);
      }
      if (orgDataRes.success) {
        setOrgData(orgDataRes.organization);
        setOrgName(orgDataRes.organization.name);
        setOrgSlug(orgDataRes.organization.slug);
      }
      setLoading(false);
    } catch (err: any) {
      if (reqId !== requestIdRef.current) return;
      setError(err.message || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const fetchTranslators = async () => {
    try {
      const res = await fetch('/api/translators', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setTranslators(data.translators || []);
    } catch {}
  };

  const fetchBilling = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/billing/plans', { cache: 'no-store' }),
        fetch('/api/billing/invoices', { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const iData = await iRes.json();
      if (pData.success) setPlans(pData.plans || []);
      if (iData.success) setInvoices(iData.invoices || []);
    } catch {}
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTranslators();
    fetchBilling();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLanguage = (lang: { code: string; name: string }) => {
    if (selectedLanguages.some((l) => l.code === lang.code)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l.code !== lang.code));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // 1. CREATE EVENT
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    if (selectedLanguages.length === 0) {
      alert('Please select at least one language for this event.');
      return;
    }

    try {
      setCreatingEvent(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDesc.trim(),
          scheduled_start: new Date().toISOString(),
          languages: selectedLanguages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to create event');
        setCreatingEvent(false);
        return;
      }

      // Immediately and atomically add the returned event to state to prevent any UI blink
      if (data.event) {
        const newEventWithRooms = {
          ...data.event,
          languages: data.event.languages || selectedLanguages.map((l) => ({ language_code: l.code, language_name: l.name })),
          rooms: data.rooms || data.event.rooms || [],
        };
        setEvents((prev) => [newEventWithRooms, ...prev.filter((ev) => ev.id !== newEventWithRooms.id)]);
        setStats((prev: any) =>
          prev
            ? {
                ...prev,
                totalEvents: (prev.totalEvents || 0) + 1,
                totalRooms: (prev.totalRooms || 0) + (newEventWithRooms.rooms?.length || 0),
              }
            : prev
        );
      }

      setNewEventTitle('');
      setNewEventDesc('');
      setIsCreateModalOpen(false);
      setCreatingEvent(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error creating event');
      setCreatingEvent(false);
    }
  };

  // 2. EDIT EVENT
  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDesc(event.description || '');
    setEditStatus(event.status);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingEvent(null);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update event');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 3. ADD LANGUAGE TO EVENT
  const handleAddLanguageToEvent = async () => {
    if (!editingEvent || !newLangCode || !newLangName) return;
    try {
      const res = await fetch(`/api/events/${editingEvent.id}/languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newLangCode, name: newLangName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLangCode('');
        setNewLangName('');
        // Refresh event data in modal
        const evRes = await fetch(`/api/events/${editingEvent.id}`);
        const evData = await evRes.json();
        if (evData.success) setEditingEvent(evData.event);
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4. REMOVE LANGUAGE FROM EVENT
  const handleRemoveLanguageFromEvent = async (languageId: string) => {
    if (!editingEvent) return;
    if (!confirm('Remove this translation channel?')) return;
    try {
      const res = await fetch(`/api/events/${editingEvent.id}/languages?languageId=${languageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const evRes = await fetch(`/api/events/${editingEvent.id}`);
        const evData = await evRes.json();
        if (evData.success) setEditingEvent(evData.event);
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 4b. DELETE EVENT (PERMANENT SUPABASE DELETION)
  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"?\n\nThis will permanently delete the event, dynamic translation channels, and all associated session logs from the Supabase PostgreSQL database.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setStats((prev: any) =>
          prev
            ? {
                ...prev,
                totalEvents: Math.max(0, (prev.totalEvents || 1) - 1),
              }
            : prev
        );
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to delete event from database');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting event');
    }
  };

  // Filtered & displayed events for history and search
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchQuery.trim() ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      event.languages?.some((l: any) =>
        l.language_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.language_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedEvents = viewAllEvents ? filteredEvents : filteredEvents.slice(0, 10);

  // 5. INVITE TRANSLATOR
  const handleInviteTranslator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!translatorName.trim() || !translatorEmail.trim()) return;
    try {
      const langs = translatorLangs.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const res = await fetch('/api/translators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: translatorName.trim(),
          email: translatorEmail.trim(),
          native_languages: langs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslatorName('');
        setTranslatorEmail('');
        setTranslatorLangs('');
        setIsInviteTranslatorOpen(false);
        fetchTranslators();
      } else {
        alert(data.error || 'Failed to add translator');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 6. UPGRADE PLAN
  const handleUpgradePlan = async (slug: string) => {
    try {
      const res = await fetch('/api/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: slug }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully updated subscription to ${slug.toUpperCase()}!`);
        fetchDashboardData();
        fetchBilling();
      } else {
        alert(data.error || 'Failed to update plan');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 7. SAVE ORGANIZATION
  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, slug: orgSlug }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Organization updated successfully!');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update organization');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const quotaPercent = stats ? Math.min(100, Math.round((stats.usedMinutes / stats.quotaMinutes) * 100)) : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading multi-tenant console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Multi-Tenant Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {orgData?.name || 'Organization Console'}
          </h1>
          <p className="text-sm text-slate-400">
            Tenant: <span className="font-mono text-slate-300">/{orgData?.slug || 'acme-global'}</span> • Plan: <span className="text-emerald-400 font-semibold">{stats?.planName || 'Pro'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for All 11 Multi-Tenant Operations */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition ${
            activeTab === 'events'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Channels</span>
        </button>

        <button
          onClick={() => setActiveTab('translators')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition ${
            activeTab === 'translators'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Translators Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition ${
            activeTab === 'billing'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription & Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition ${
            activeTab === 'organization'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Manage Organization</span>
        </button>
      </div>

      {/* Metrics Row (Always Available for Monitoring Usage & Live Listeners) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Events</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalEvents || 0}</div>
          <div className="text-xs text-emerald-400 font-medium">
            {stats?.activeEvents || 0} currently live
          </div>
        </div>

        {/* Translation Rooms */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dynamic Rooms</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalRooms || 0}</div>
          <div className="text-xs text-blue-400 font-medium">
            {stats?.liveRooms || 0} active channels
          </div>
        </div>

        {/* Live Audience (Real Listeners) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Connected Listeners</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalLiveListeners || 0}</div>
          <div className="text-xs text-slate-500">Real WebRTC subscribers</div>
        </div>

        {/* Usage & Quota */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Translation Minutes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {stats?.usedMinutes || 0}
            <span className="text-sm font-normal text-slate-400"> / {stats?.quotaMinutes || 120}m</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${quotaPercent > 90 ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ==========================================================
          TAB 1: EVENTS, PERMANENT SUPABASE STORAGE & EXCEL TABLE
          ========================================================== */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Header & Control Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Event Management & History</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                    Supabase PostgreSQL DB
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authoritative permanent database records. Stored in Supabase tables: <code className="font-mono text-slate-300">events</code>, <code className="font-mono text-slate-300">event_languages</code>, <code className="font-mono text-slate-300">translation_rooms</code>.
                </p>
              </div>

              {/* View All Events / Show Recent 10 Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewAllEvents(!viewAllEvents)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                    viewAllEvents
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {viewAllEvents ? 'Show Recent 10' : `View All Events (${events.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events by name, ID, language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900">All Statuses</option>
                    <option value="scheduled" className="bg-slate-900">Scheduled</option>
                    <option value="live" className="bg-slate-900">Live Broadcasting</option>
                    <option value="ended" className="bg-slate-900">Ended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <Radio className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-white">No Events Stored in Supabase</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Create an event to automatically persist records in Supabase PostgreSQL tables.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition"
              >
                Create Event Now
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm text-slate-400">No events matched your search or status filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs text-emerald-400 hover:underline"
              >
                Clear search & filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedEvents.map((event) => {
                const audienceUrl =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/listen/${event.public_access_token}`
                    : `/listen/${event.public_access_token}`;

                return (
                  <div
                    key={event.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md"
                  >
                    {/* Event Meta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-white">{event.title}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              event.status === 'live'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                        )}
                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                          ID: {event.id} • Created: {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action buttons: Edit, QR Code, Copy Link, Open, Delete */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openEditModal(event)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() =>
                            setQrModal({
                              isOpen: true,
                              url: audienceUrl,
                              title: event.title,
                            })
                          }
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>QR Code</span>
                        </button>

                        <button
                          onClick={() => handleCopy(audienceUrl, `aud-${event.id}`)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
                        >
                          {copiedToken === `aud-${event.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied Link!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Audience Link</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/listen/${event.public_access_token}`}
                          target="_blank"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          title="Permanently Delete Event"
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Language Channels */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span>Dynamically Generated Translation Channels ({event.rooms?.length || 0})</span>
                        <button
                          onClick={() => openEditModal(event)}
                          className="text-emerald-400 hover:text-emerald-300 normal-case flex items-center space-x-1 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Manage Languages</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {event.rooms?.map((room: any) => {
                          const lang = event.languages?.find((l: any) => l.id === room.event_language_id);
                          const translatorUrl =
                            typeof window !== 'undefined'
                              ? `${window.location.origin}/translator/room/${room.secure_room_token}`
                              : `/translator/room/${room.secure_room_token}`;

                          return (
                            <div
                              key={room.id}
                              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Globe className="w-4 h-4 text-emerald-400" />
                                  <span className="text-sm font-bold text-white">
                                    {lang?.language_name || 'Language'}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                    room.status === 'live'
                                      ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {room.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Listeners:</span>
                                <strong className="text-slate-200">{room.active_listener_count || 0}</strong>
                              </div>

                              <div className="flex items-center space-x-2 pt-1 border-t border-slate-900">
                                <Link
                                  href={`/translator/room/${room.secure_room_token}`}
                                  target="_blank"
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                                >
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>Launch Translator</span>
                                </Link>

                                <button
                                  onClick={() => handleCopy(translatorUrl, `trn-${room.id}`)}
                                  title="Copy Translator Invite Link"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                >
                                  {copiedToken === `trn-${room.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB 2: TRANSLATORS DIRECTORY & ASSIGNMENTS
          ========================================================== */}
      {activeTab === 'translators' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Translators Directory</h2>
              <p className="text-xs text-slate-400">Manage qualified human translators, languages, and assignments</p>
            </div>
            <button
              onClick={() => setIsInviteTranslatorOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Translator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {translators.map((t) => (
              <div key={t.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{t.full_name}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                    {t.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{t.email}</div>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-500">Native Languages:</span>
                  <div className="flex gap-1">
                    {t.native_languages.map((l: string) => (
                      <span key={l} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 3: SUBSCRIPTION, QUOTAS & INVOICES
          ========================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Subscription Plans */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Subscription Plans & Quotas</h2>
              <p className="text-xs text-slate-400">Scale your concurrent translation rooms and broadcast quotas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isCurrent = stats?.planName?.toLowerCase().includes(p.slug.toLowerCase());
                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-white">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-white">
                        ${(p.price_cents / 100).toFixed(0)}
                        <span className="text-xs font-normal text-slate-400"> / month</span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                        <li>• {p.monthly_minute_quota} translation minutes / month</li>
                        <li>• Up to {p.max_concurrent_rooms} concurrent translation rooms</li>
                        <li>• Up to {p.max_events} scheduled events</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleUpgradePlan(p.slug)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-500 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                      }`}
                    >
                      {isCurrent ? 'Active Plan' : `Switch to ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Billing Invoices & Receipts</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2">Invoice ID</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 font-mono text-emerald-400">{inv.id}</td>
                      <td className="text-slate-300">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="text-slate-200">{inv.billing_reason}</td>
                      <td className="font-bold text-white">${(inv.amount_cents / 100).toFixed(2)}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase font-mono text-[10px]">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 4: MANAGE ORGANIZATION
          ========================================================== */}
      {activeTab === 'organization' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Organization Settings</h2>
            <p className="text-xs text-slate-400">Configure your tenant profile, branding, and access slug</p>
          </div>

          <form onSubmit={handleSaveOrganization} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tenant Slug</label>
              <input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition"
            >
              Save Organization
            </button>
          </form>
        </div>
      )}

      {/* Recent System Activity */}
      {activityLogs.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Recent System Activity
          </h2>
          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs py-2 border-b border-slate-800/60 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-emerald-400 font-semibold">{log.event_type}</span>
                  <span className="text-slate-300">{log.description}</span>
                </div>
                <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal for Audience Links */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, url: '', title: '' })}
        url={qrModal.url}
        title={qrModal.title}
      />

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Event</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Innovation Summit 2026"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Keynote presentations and multi-lingual technical panels"
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Dynamic Translation Languages * (Select at least 1)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {COMMON_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.some((l) => l.code === lang.code);
                    return (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => handleToggleLanguage(lang)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{lang.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent || selectedLanguages.length === 0}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
                >
                  {creatingEvent ? 'Creating Dynamic Rooms...' : 'Create Event & Rooms'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event & Manage Languages Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Event & Manage Languages</h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Event Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              {/* Dynamic Languages in this Event */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">
                  Translation Channels ({editingEvent.languages?.length || 0})
                </label>
                <div className="space-y-2">
                  {editingEvent.languages?.map((lang: any) => (
                    <div
                      key={lang.id}
                      className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">{lang.language_name}</span>
                        <span className="font-mono text-slate-500 uppercase">({lang.language_code})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguageFromEvent(lang.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Language Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Lang (e.g. German)"
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. de)"
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLanguageToEvent}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Translator Modal */}
      {isInviteTranslatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Invite Human Translator</h3>
              <button
                onClick={() => setIsInviteTranslatorOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteTranslator} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  value={translatorName}
                  onChange={(e) => setTranslatorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="translator@events.com"
                  value={translatorEmail}
                  onChange={(e) => setTranslatorEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Languages (comma separated)</label>
                <input
                  type="text"
                  placeholder="es, en, fr"
                  value={translatorLangs}
                  onChange={(e) => setTranslatorLangs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteTranslatorOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
                >
                  Add Translator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
