'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function LegacySuperAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin/login');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <Shield className="w-6 h-6 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-white">Redirecting to Super Admin Portal...</h2>
      <p className="text-sm text-slate-400">
        If you are not redirected automatically,{' '}
        <Link href="/super-admin/login" className="text-amber-400 underline">
          click here to open Super Admin Login
        </Link>
        .
      </p>
    </div>
  );
}
