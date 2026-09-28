'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function LegacyAdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <Activity className="w-6 h-6 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-white">Redirecting to Admin Portal...</h2>
      <p className="text-sm text-slate-400">
        If you are not redirected automatically,{' '}
        <Link href="/admin/login" className="text-emerald-400 underline">
          click here to open Admin Login
        </Link>
        .
      </p>
    </div>
  );
}
