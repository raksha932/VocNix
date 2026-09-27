import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radio, Activity, Shield, LogOut, User, Lock } from 'lucide-react';
import { getServerSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'VocNix — Real-Time Audio Translation Platform',
  description: 'Production-grade, dynamic multi-tenant real-time human audio translation powered by LiveKit & WebRTC',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">VocNix</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME AUDIO
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-5 text-sm font-medium">
              {/* Authenticated as Admin: Only display Admin Dashboard */}
              {session?.role === 'admin' && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-slate-300 hover:text-white transition flex items-center space-x-1.5"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard</span>
                  </Link>

                  <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                        Admin
                      </span>
                      <span className="hidden sm:inline font-medium text-slate-300">
                        {session.email}
                      </span>
                    </div>

                    <a
                      href="/api/auth/logout"
                      className="text-slate-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </a>
                  </div>
                </>
              )}

              {/* Authenticated as Super Admin: Only display Super Admin Console */}
              {session?.role === 'super_admin' && (
                <>
                  <Link
                    href="/admin"
                    className="text-amber-400/90 hover:text-amber-300 transition flex items-center space-x-1.5 font-semibold"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Super Admin</span>
                  </Link>

                  <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        Super Admin
                      </span>
                      <span className="hidden sm:inline font-medium text-slate-300">
                        {session.email}
                      </span>
                    </div>

                    <a
                      href="/api/auth/logout"
                      className="text-slate-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </a>
                  </div>
                </>
              )}

              {/* Unauthenticated: Show portal access links */}
              {!session && (
                <>
                  <Link
                    href="/login/admin"
                    className="text-slate-300 hover:text-white transition flex items-center space-x-1.5"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Admin Login</span>
                  </Link>

                  <Link
                    href="/login/super-admin"
                    className="text-amber-400/90 hover:text-amber-300 transition flex items-center space-x-1.5 font-semibold"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Super Admin Login</span>
                  </Link>
                </>
              )}

              <Link
                href="/api/health"
                target="_blank"
                className="text-slate-400 hover:text-slate-300 transition flex items-center space-x-1 text-xs"
              >
                <span>Health</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          <p>© 2026 VocNix Real-Time Audio Platform. Production-grade WebRTC Live Audio. Human Translation Only.</p>
        </footer>
      </body>
    </html>
  );
}
