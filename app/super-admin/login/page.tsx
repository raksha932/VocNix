'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Activity, KeyRound } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWrongRole, setIsWrongRole] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsWrongRole(false);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Super Admin username or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          requiredRole: 'super_admin',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'WRONG_ROLE_ADMIN' || res.status === 403) {
          setIsWrongRole(true);
        }
        setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Super Admin authenticated successfully! Entering Command Center...');
      setTimeout(() => {
        router.push(data.redirectUrl || '/admin');
        router.refresh();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error connecting to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-slate-900/90 border border-amber-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Platform Command Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Super Admin Login
            </h1>
            <p className="text-sm text-slate-400">
              Restricted portal for platform governance, multi-tenant organizations, and global settings.
            </p>
          </div>
        </div>

        {/* Notification alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>
                <strong className="font-semibold text-red-200">Access Restricted: </strong>
                <span>{errorMessage}</span>
              </div>
              {isWrongRole && (
                <div className="pt-1">
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
                  >
                    <Activity className="w-3 h-3" />
                    <span>Go to Admin Login Portal &rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Super Admin Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="superadmin or admin@vocnix.com"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/super-admin/forgot-password"
                className="text-xs text-amber-400 hover:text-amber-300 transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Verifying Super Admin Authorization...</span>
              </div>
            ) : (
              <>
                <Shield className="w-4 h-4 text-slate-950" />
                <span>Enter Super Admin Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice & Alternate Portals */}
        <div className="pt-4 border-t border-slate-800 space-y-3 text-center text-xs">
          <p className="text-slate-400">
            Need Organization Admin access?{' '}
            <Link
              href="/admin/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 transition"
            >
              Sign in at Admin Portal
            </Link>
          </p>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 text-[11px] leading-relaxed">
            <span>
              Super Admin accounts cannot be created via public registration. Need initial platform setup?{' '}
            </span>
            <Link
              href="/super-admin/setup"
              className="text-amber-400/90 hover:text-amber-300 underline font-medium inline-flex items-center space-x-1"
            >
              <KeyRound className="w-3 h-3 ml-0.5 inline" />
              <span>Initial Setup</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
