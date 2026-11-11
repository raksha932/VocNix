import Link from 'next/link';
import {
  Shield,
  Activity,
  Layers,
  Users,
  Server,
  Zap,
  ArrowRight,
  CheckCircle,
  Lock,
  BarChart3,
  UserCheck,
  Building,
  KeyRound,
  FileCheck,
} from 'lucide-react';

export default function SuperAdminLandingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-bold tracking-wide">
          <Shield className="w-3.5 h-3.5 animate-pulse" />
          <span>PLATFORM GOVERNANCE & COMMAND CENTER</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Enterprise Infrastructure & Global Tenant Management
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Centralized administrative command for global tenant provisioning, real-time audio pipeline monitoring, subscription lifecycle management, and security governance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/super-admin/login"
            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
          >
            <Shield className="w-5 h-5 text-slate-950" />
            <span>Access Command Center</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="#architecture"
            className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-2 transition border border-slate-300 dark:border-slate-800 shadow-sm"
          >
            <Server className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Platform Architecture</span>
          </Link>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section id="architecture" className="scroll-mt-24 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>System Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            High-Availability Global Audio Architecture
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            VocNix platform architecture isolates tenant environments while centralizing resource metering, live room orchestrations, and administrative security controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Tenant Provisioning</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Create, configure, and manage tenant organizations with isolated admin accounts, custom subdomains, subscription quotas, and trial extensions.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Real-Time Usage Metering</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Live broadcast telemetry tracks translated minutes across all organizations with authoritative database synchronization and audit trails.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct Impersonation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant one-click admin impersonation allows Super Admins to enter any tenant dashboard for rapid debugging, event setup, and technical assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Governance & Control Matrix */}
      <section id="governance" className="scroll-mt-24 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Platform Governance</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security, Permissions & Administrative Control
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Role-based access controls and cryptographic session validation ensure platform integrity.
          </p>
        </div>

        {/* Pipeline Diagram */}
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Command & Control Flow</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Hierarchical governance spanning global platform configuration down to live session rooms.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Step 1 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Super Admin</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Global tenant provisioning & tier assignment</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-400 dark:text-slate-600">
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Tenant Admins</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Event orchestration & interpreter management</div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Live Execution</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">WebRTC audio streaming to global listeners</div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cryptographic Sessions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              HMAC-SHA256 authenticated cookies and stateless token verification provide tamper-proof Super Admin access control.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Audit & Activity Logging</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every tenant creation, tier modification, extension, and suspension is recorded for complete governance compliance.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Seamless Organization Editing</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Directly edit individual organization details, phone numbers, administrator contacts, subscription plans, and status in real-time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
