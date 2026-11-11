import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radio, Shield } from 'lucide-react';
import { getAppMode } from '@/lib/config/app-mode';
import { getServerSession, getUserDisplayName } from '@/lib/auth/session';
import ThemeToggle from '@/components/ThemeToggle';
import ThemeScript from '@/components/ThemeScript';
import NavAuthLinks from '@/components/NavAuthLinks';
import { Repository } from '@/lib/db/repository';

export const metadata: Metadata = {
  title: 'VocNix – Real-Time Audio Translation Platform',
  description: 'Real-time human audio translation platform delivering browser microphone audio directly to audiences worldwide.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Authoritative database profile resolution
  let dbProfile = null;
  if (session?.userId) {
    dbProfile = await Repository.getProfileById(session.userId);
    if (!dbProfile && session.email) {
      dbProfile = await Repository.getProfileByEmail(session.email);
    }
  }

  const effectiveFullName = dbProfile?.full_name?.trim() || session?.full_name?.trim();
  const effectiveAvatar = dbProfile?.avatar_url !== undefined ? dbProfile.avatar_url : (session?.avatar || null);
  const displayName = effectiveFullName || getUserDisplayName(session);
  const isAuthUser = Boolean(session?.role === 'admin' || session?.role === 'super_admin');

const isSuperAdminApp = getAppMode() === 'super_admin';

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col min-h-screen transition-colors duration-150">
        <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                isSuperAdminApp
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 group-hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20'
              }`}>
                {isSuperAdminApp ? (
                  <Shield className="w-5 h-5 animate-pulse text-amber-500 dark:text-amber-400" />
                ) : (
                  <Radio className="w-5 h-5 animate-pulse text-emerald-500 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">VocNix</span>
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded border ${
                  isSuperAdminApp
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}>
                  {isSuperAdminApp ? 'INFRASTRUCTURE' : 'REAL-TIME AUDIO'}
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
              {!isAuthUser && (
                <>
                  <Link
                    href={isSuperAdminApp ? "/#architecture" : "/#about"}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  >
                    {isSuperAdminApp ? "Architecture" : "About"}
                  </Link>

                  <Link
                    href={isSuperAdminApp ? "/#governance" : "/#features"}
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  >
                    {isSuperAdminApp ? "Governance" : "Features"}
                  </Link>

                  {!isSuperAdminApp && (
                    <Link
                      href="/#support"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    >
                      Support
                    </Link>
                  )}
                </>
              )}

              {/* Dynamic Role-Based / Context-Aware Auth Links */}
              <NavAuthLinks session={session} displayName={displayName} initialAvatar={effectiveAvatar} />

              {/* Theme Switcher Toggle */}
              <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 transition-colors">
          <p>© 2026 VocNix Real-Time Audio Platform. Real-Time Human Translation Audio.</p>
        </footer>
      </body>
    </html>
  );
}
