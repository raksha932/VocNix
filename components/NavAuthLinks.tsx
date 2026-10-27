'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Shield, LogOut, User, ChevronDown } from 'lucide-react';
import { UserSession } from '@/lib/auth/session';

interface NavAuthLinksProps {
  session: UserSession | null;
  displayName: string;
}

export default function NavAuthLinks({ session, displayName }: NavAuthLinksProps) {
  const pathname = usePathname() || '';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(session?.avatar || null);
  const [currentName, setCurrentName] = useState<string>(displayName);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with profile update events across the entire application
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        if (e.detail.avatar_url !== undefined) {
          setCurrentAvatar(e.detail.avatar_url);
        }
        if (e.detail.full_name) {
          setCurrentName(e.detail.full_name);
        }
      }
    };
    window.addEventListener('vocnix_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('vocnix_profile_updated', handleProfileUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown when route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const isAdminAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/signup');
  const isSuperAdminAuthPage =
    pathname.startsWith('/super-admin/login') ||
    pathname.startsWith('/super-admin/signup') ||
    pathname.startsWith('/super-admin/setup');

  // Authenticated as Admin: Display name ONCE with avatar & clean dropdown (My Profile & Logout in red)
  if (session?.role === 'admin') {
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition flex items-center space-x-1.5 text-xs sm:text-sm font-medium"
        >
          <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Dashboard</span>
        </Link>

        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-500/50 transition shadow-sm text-left group"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar / Profile Picture */}
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={currentName}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/50 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-sm">
                {currentName ? currentName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

            {/* Admin Name - Rendered ONCE */}
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition max-w-[140px] sm:max-w-[180px] truncate">
              {currentName}
            </span>

            {/* Dropdown Chevron */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-emerald-500 dark:text-emerald-400' : ''
              }`}
            />
          </button>

          {/* Clean, compact dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Option 1: My Profile */}
              <Link
                href="/dashboard/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition"
              >
                <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>My Profile</span>
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              {/* Option 2: Logout (styled in red) */}
              <a
                href="/api/auth/logout"
                className="flex items-center space-x-2.5 px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-lg transition"
              >
                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>Logout</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Authenticated as Super Admin: Render name only once with avatar and clean dropdown
  if (session?.role === 'super_admin') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-500/50 transition shadow-sm text-left group"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {/* Avatar / Profile Picture */}
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={currentName}
              className="w-7 h-7 rounded-full object-cover border border-amber-500/50 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-sm">
              {currentName ? currentName.charAt(0).toUpperCase() : 'S'}
            </div>
          )}

          {/* Super Admin Name - Rendered ONCE */}
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition max-w-[140px] sm:max-w-[180px] truncate">
            {currentName}
          </span>

          {/* Dropdown Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-amber-500 dark:text-amber-400' : ''
            }`}
          />
        </button>

        {/* Clean, compact dropdown menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Option 1: My Profile */}
            <Link
              href="/admin/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition"
            >
              <User className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>My Profile</span>
            </Link>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {/* Option 2: Logout (styled in red) */}
            <a
              href="/api/auth/logout"
              className="flex items-center space-x-2.5 px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-lg transition"
            >
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Logout</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated: Strictly isolated based on current page
  if (isAdminAuthPage) {
    // When on Admin Login or Signup, show ONLY Admin option
    return (
      <div className="flex items-center space-x-2">
        <Link
          href="/admin/login"
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-sm shadow-emerald-500/20"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Admin Portal</span>
        </Link>
      </div>
    );
  }

  if (isSuperAdminAuthPage) {
    // When on Super Admin Login or Signup, show ONLY Super Admin option
    return (
      <div className="flex items-center space-x-2">
        <Link
          href="/super-admin/login"
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-sm shadow-amber-500/20"
        >
          <Shield className="w-3.5 h-3.5 text-slate-950" />
          <span>Super Admin Portal</span>
        </Link>
      </div>
    );
  }

  // Default: Public visitor
  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <Link
        href="/admin/login"
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition"
      >
        Admin Login
      </Link>
      <Link
        href="/super-admin/login"
        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold transition shadow-sm shadow-amber-500/20"
      >
        Super Admin
      </Link>
    </div>
  );
}
