'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ShieldCheck, ArrowRight, AlertCircle, Radio, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto shadow-inner">
            <Activity className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Role: Organization Admin
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-sm text-slate-400">
              Sign in with your Google account to manage your live events, translation rooms, and translators.
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-red-200">Authentication Alert: </strong>
              <span>
                {error === 'unauthorized'
                  ? 'Access denied. You do not have permissions for this action.'
                  : error}
              </span>
            </div>
          </div>
        )}

        {/* Google OAuth Action */}
        <div className="space-y-4">
          <a
            href="/api/auth/google?role=admin"
            className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition shadow-lg hover:shadow-xl group"
          >
            {/* Official Google SVG Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
          </a>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Access Guarantee</span>
            </div>
            <p>
              Admin authentication grants exclusive access to the <strong>Admin Dashboard</strong>. You will not have access to any Super Admin platform controls.
            </p>
          </div>
        </div>

        {/* Footer / Switch Portal */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition flex items-center space-x-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>VocNix Home</span>
          </Link>
          <Link
            href="/login/super-admin"
            className="text-amber-400/80 hover:text-amber-300 transition flex items-center space-x-1"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Super Admin Login →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
