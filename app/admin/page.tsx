'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  DollarSign,
  Users,
  Activity,
  Radio,
  Clock,
  Ban,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  FileText,
} from 'lucide-react';

export default function SuperAdminPage() {
  const [overview, setOverview] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrgId, setUpdatingOrgId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [ovRes, orgsRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/organizations'),
      ]);

      const ovData = await ovRes.json();
      const orgsData = await orgsRes.json();

      if (ovData.success) setOverview(ovData.overview);
      if (orgsData.success) {
        setOrganizations(orgsData.organizations || []);
        setPlans(orgsData.plans || []);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  // 1. SUSPEND ORGANIZATION
  const handleSuspend = async (orgId: string) => {
    if (!confirm('Are you sure you want to SUSPEND this organization? Translators will not be able to broadcast.')) return;
    setUpdatingOrgId(orgId);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });
      const data = await res.json();
      if (data.success) fetchAdminData();
      else alert(data.error);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingOrgId(null);
    }
  };

  // 2. REACTIVATE ORGANIZATION
  const handleReactivate = async (orgId: string) => {
    setUpdatingOrgId(orgId);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      const data = await res.json();
      if (data.success) fetchAdminData();
      else alert(data.error);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingOrgId(null);
    }
  };

  // 3. CHANGE PLAN
  const handleChangePlan = async (orgId: string, planSlug: string) => {
    setUpdatingOrgId(orgId);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_plan', planSlug }),
      });
      const data = await res.json();
      if (data.success) fetchAdminData();
      else alert(data.error);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingOrgId(null);
    }
  };

  // 4. EXTEND TRIAL
  const handleExtendTrial = async (orgId: string) => {
    setUpdatingOrgId(orgId);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend_trial', days: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      } else alert(data.error);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingOrgId(null);
    }
  };

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading Platform Super Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Super Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-amber-500/30 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Role 1 — Super Admin • Platform Owner</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Command Center</h1>
          <p className="text-sm text-slate-400">
            Global governance: Monitor all organizations, revenue, usage, active broadcasts, and subscriptions
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Stats</span>
        </button>
      </div>

      {/* Global Revenue & Usage KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Recurring Revenue (MRR) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Platform MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            ${(overview?.monthlyRecurringRevenue || 0).toLocaleString()}
            <span className="text-xs font-normal text-slate-400"> / mo</span>
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>${(overview?.totalInvoicedRevenue || 0).toLocaleString()} total invoiced</span>
          </div>
        </div>

        {/* Platform Translation Minutes */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Platform Usage</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {overview?.totalPlatformMinutesUsed || 0}
            <span className="text-xs font-normal text-slate-400"> mins</span>
          </div>
          <div className="text-xs text-slate-500">Across all tenant broadcasts</div>
        </div>

        {/* Total Organizations */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Organizations</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{overview?.totalOrganizations || 0}</div>
          <div className="text-xs text-blue-400 font-medium">
            {overview?.activeOrganizations || 0} active • {overview?.suspendedOrganizations || 0} suspended
          </div>
        </div>

        {/* Live Events & Dynamic Rooms */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Live Broadcasts</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{overview?.totalLiveEvents || 0}</div>
          <div className="text-xs text-purple-400 font-medium">
            {overview?.totalDynamicRooms || 0} total dynamic rooms
          </div>
        </div>
      </div>

      {/* Live Events Across All Tenants */}
      {overview?.recentLiveEvents && overview.recentLiveEvents.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">Active Live Broadcasts Across All Tenants</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.recentLiveEvents.map((ev: any) => (
              <div key={ev.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{ev.title}</div>
                  <div className="text-xs text-slate-400">Org: {ev.organizationName} • {ev.roomsCount} translation rooms</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">{ev.activeListeners} Listeners</span>
                  <div className="text-[10px] text-slate-500">Live WebRTC</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizations Directory & Governance Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Manage All Organizations</h2>
            <p className="text-xs text-slate-400">Control subscription tiers, suspension, trial periods, and usage limits</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-3">
              <tr>
                <th className="py-2.5">Organization</th>
                <th>Status</th>
                <th>Current Plan</th>
                <th>Platform Usage</th>
                <th>Events</th>
                <th>Trial / Period Ends</th>
                <th className="text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrgs.map((org) => {
                const isSuspended = org.status === 'suspended';
                const usagePercent = Math.min(100, Math.round((org.usedMinutes / org.quotaMinutes) * 100));

                return (
                  <tr key={org.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3.5">
                      <div className="font-bold text-white text-sm">{org.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">/{org.slug}</div>
                    </td>

                    <td>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          isSuspended
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>

                    <td>
                      <select
                        value={org.plan_id}
                        disabled={updatingOrgId === org.id}
                        onChange={(e) => {
                          const selected = plans.find((p) => p.id === e.target.value);
                          if (selected) handleChangePlan(org.id, selected.slug);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${(p.price_cents / 100).toFixed(0)}/mo)
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div className="font-mono text-slate-200 font-bold">
                        {org.usedMinutes}m / {org.quotaMinutes}m
                      </div>
                      <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-amber-400'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="font-semibold text-slate-300">{org.totalEvents} events</td>

                    <td className="text-slate-400">
                      {new Date(org.trialEndsAt).toLocaleDateString()}
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Extend Trial */}
                        <button
                          onClick={() => handleExtendTrial(org.id)}
                          disabled={updatingOrgId === org.id}
                          title="Extend trial/billing period by 30 days"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          +30d Trial
                        </button>

                        {/* Suspend or Reactivate */}
                        {isSuspended ? (
                          <button
                            onClick={() => handleReactivate(org.id)}
                            disabled={updatingOrgId === org.id}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded-lg border border-emerald-500/40 transition flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(org.id)}
                            disabled={updatingOrgId === org.id}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg border border-red-500/40 transition flex items-center space-x-1"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
