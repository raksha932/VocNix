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
  UserCheck,
  Trash2,
  Plus,
  Building,
  X,
  AlertCircle,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Check,
} from 'lucide-react';

export default function SuperAdminPage() {
  const [overview, setOverview] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrgId, setUpdatingOrgId] = useState<string | null>(null);

  // Impersonate Feature State
  const [selectedImpersonateOrgId, setSelectedImpersonateOrgId] = useState<string>('');
  const [isImpersonatingLoading, setIsImpersonatingLoading] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  // Create Organization Modal State
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [newOrgStatus, setNewOrgStatus] = useState<'active' | 'inactive'>('active');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [newOrgPlanId, setNewOrgPlanId] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  // Delete Organization State
  const [orgToDelete, setOrgToDelete] = useState<any | null>(null);
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


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
        if (!selectedImpersonateOrgId && orgsData.organizations?.length > 0) {
          // Pre-select first organization for instant usability
          setSelectedImpersonateOrgId(orgsData.organizations[0].id);
        }
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

  // 1. CREATE ORGANIZATION WITH ADMIN PROVISIONING
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      setCreateOrgError('Organization Name is required.');
      return;
    }

    if (!newAdminEmail.trim()) {
      setCreateOrgError('Admin Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail.trim())) {
      setCreateOrgError('Please enter a valid administrator email address (e.g. name@domain.com).');
      return;
    }

    setCreatingOrg(true);
    setCreateOrgError(null);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName.trim(),
          slug: newOrgSlug.trim() || undefined,
          admin_name: newAdminName.trim() || undefined,
          admin_email: newAdminEmail.trim().toLowerCase(),
          contact_number: newContactNumber.trim() || undefined,
          status: newOrgStatus,
          plan_id: newOrgPlanId || plans[0]?.id || 'plan-starter',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateOrgError(data.error || 'Failed to create organization');
        setCreatingOrg(false);
        return;
      }

      setCreateSuccessMsg(`Organization "${data.organization?.name || newOrgName}" and admin account created successfully! Initial password: Admin123!`);
      setTimeout(() => setCreateSuccessMsg(null), 6000);

      // Reset form & close modal
      setNewOrgName('');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewContactNumber('');
      setNewOrgSlug('');
      setSlugManuallyEdited(false);
      setNewOrgPlanId('');
      setNewOrgStatus('active');
      setIsAddOrgModalOpen(false);
      setCreatingOrg(false);

      // Refresh organizations
      await fetchAdminData();

      // Automatically focus and select the newly created organization in dropdown
      if (data.organization?.id) {
        setSelectedImpersonateOrgId(data.organization.id);
      }
    } catch (err: any) {
      setCreateOrgError(err.message || 'Network error creating organization');
      setCreatingOrg(false);
    }
  };

  // 2. IMPERSONATE ORGANIZATION ADMIN
  const handleStartImpersonation = async (orgId: string) => {
    if (!orgId) return;
    const targetOrg = organizations.find((o) => o.id === orgId);
    const hasAdmin = Boolean(targetOrg?.hasAdmin || targetOrg?.admin_email || targetOrg?.adminUser);

    if (!hasAdmin) {
      setImpersonateError(
        `Organization "${targetOrg?.name || 'Selected'}" does not have an administrator account configured. Please create or assign an administrator before impersonating.`
      );
      return;
    }

    setIsImpersonatingLoading(true);
    setImpersonateError(null);

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImpersonateError(data.error || 'Failed to start impersonation');
        setIsImpersonatingLoading(false);
        return;
      }

      // Seamlessly navigate to Admin Dashboard with tenant isolation
      window.location.href = data.redirectUrl || `/dashboard?impersonate=true&orgId=${orgId}`;
    } catch (err: any) {
      setImpersonateError(err.message || 'Network error starting impersonation');
      setIsImpersonatingLoading(false);
    }
  };

  // 3. SUSPEND ORGANIZATION
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

  // 5. DELETE ORGANIZATION
  const handleConfirmDeleteOrg = async () => {
    if (!orgToDelete) return;
    setIsDeletingOrg(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/organizations/${orgToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || 'Failed to delete organization');
        setIsDeletingOrg(false);
        return;
      }

      setCreateSuccessMsg(`Organization "${orgToDelete.name}" was successfully deleted.`);
      setTimeout(() => setCreateSuccessMsg(null), 5000);
      setOrgToDelete(null);
      await fetchAdminData();
    } catch (err: any) {
      setDeleteError(err.message || 'Network error deleting organization');
    } finally {
      setIsDeletingOrg(false);
    }
  };

  // 4. REACTIVATE ORGANIZATION
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

  // 5. CHANGE PLAN
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

  // 6. EXTEND TRIAL
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
      o.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.admin_email && o.admin_email.toLowerCase().includes(searchQuery.toLowerCase()))
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

        <div className="flex items-center self-start sm:self-auto">
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Stats</span>
          </button>
        </div>
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
        {createSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{createSuccessMsg}</span>
            </div>
            <button
              onClick={() => setCreateSuccessMsg(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Manage All Organizations</h2>
            <p className="text-xs text-slate-400">Control subscription tiers, suspension, trial periods, and direct admin impersonation</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search organizations or admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-52 sm:w-64"
              />
            </div>

            <button
              onClick={() => {
                setCreateOrgError(null);
                setIsAddOrgModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-3">
              <tr>
                <th className="py-2.5">Organization</th>
                <th>Admin Account</th>
                <th>Status</th>
                <th>Current Plan</th>
                <th>Platform Usage</th>
                <th>Events</th>
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
                      {org.admin_email ? (
                        <div>
                          <div className="text-slate-200 font-semibold">{org.admin_name || 'Admin'}</div>
                          <div className="font-mono text-[10px] text-slate-400">{org.admin_email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No admin assigned</span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          isSuspended
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : org.status === 'inactive'
                            ? 'bg-slate-700/40 text-slate-400 border border-slate-600'
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
                            {p.name}
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

                    <td className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Quick Impersonate in Table */}
                        <button
                          onClick={() => {
                            setSelectedImpersonateOrgId(org.id);
                            handleStartImpersonation(org.id);
                          }}
                          disabled={updatingOrgId === org.id || isImpersonatingLoading}
                          title={org.hasAdmin ? `Enter ${org.name} Admin Dashboard` : `No admin account for ${org.name}`}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center space-x-1 ${
                            org.hasAdmin
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Impersonate</span>
                        </button>

                        {/* Extend Trial */}
                        <button
                          onClick={() => handleExtendTrial(org.id)}
                          disabled={updatingOrgId === org.id}
                          title="Extend trial/billing period by 30 days"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        >
                          +30d
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
                        {/* Delete Organization */}
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setOrgToDelete(org);
                          }}
                          disabled={updatingOrgId === org.id}
                          title={`Delete ${org.name}`}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 space-y-2">
                    <p className="text-sm">No organizations found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
                    <button
                      onClick={() => {
                        setCreateOrgError(null);
                        setIsAddOrgModalOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Organization</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FEATURE 1: Super Admin – Create New Organization Modal */}
      {isAddOrgModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Create Organization</h3>
                  <p className="text-xs text-slate-400">Provision a new tenant organization with an integrated administrator account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOrgModalOpen(false);
                  setCreateOrgError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createOrgError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-red-200">Validation Error: </strong>
                  <span>{createOrgError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              {/* 1. Organization Name (Required) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Organization Name *</span>
                  <span className="text-slate-500 font-normal">e.g. Apex Global Tech</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Tech"
                  value={newOrgName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewOrgName(val);
                    if (!slugManuallyEdited) {
                      setNewOrgSlug(
                        val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                      );
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* 2. Organization Admin Name (Optional) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Organization Admin Name</span>
                  <span className="text-slate-500 font-normal">Administrator contact name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* 3. Admin Email (Required) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Admin Email *</span>
                  <span className="text-slate-500 font-normal">For login & notifications</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@apex-tech.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>

              {/* 4. Contact Number (Optional) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Contact Number</span>
                  <span className="text-slate-500 font-normal">Optional phone</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 345-6789"
                  value={newContactNumber}
                  onChange={(e) => setNewContactNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
                />
              </div>

              {/* 5. Organization Status (Active/Inactive) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Organization Status</label>
                  <select
                    value={newOrgStatus}
                    onChange={(e) => setNewOrgStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="active">Active (Operational & Allowed to Broadcast)</option>
                    <option value="inactive">Inactive (Pending Setup)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Initial Subscription Plan</label>
                  <select
                    value={newOrgPlanId}
                    onChange={(e) => setNewOrgPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.duration_label || `${p.monthly_minute_quota} mins`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organization Slug / Subdomain */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Routing Slug</span>
                  <span className="text-slate-500 font-normal">Tenant URL path</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 font-mono text-xs">/</span>
                  <input
                    type="text"
                    placeholder="apex-global-tech"
                    value={newOrgSlug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setNewOrgSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      );
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOrgModalOpen(false);
                    setCreateOrgError(null);
                  }}
                  disabled={creatingOrg}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrg}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {creatingOrg ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-slate-950" />
                      <span>Create Organization</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Delete Confirmation Modal */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Organization</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{orgToDelete.name}</strong>? All associated events, dynamic rooms, and tenant records will be permanently removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setOrgToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingOrg}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrg}
                disabled={isDeletingOrg}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition flex items-center space-x-1.5 shadow-md shadow-red-600/30 disabled:opacity-50"
              >
                {isDeletingOrg ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Organization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
