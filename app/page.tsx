import { getAppMode } from '@/lib/config/app-mode';
import { getServerSession } from '@/lib/auth/session';
import AdminLandingPage from '@/components/landing/AdminLandingPage';
import SuperAdminLandingPage from '@/components/landing/SuperAdminLandingPage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const mode = getAppMode();
  if (mode === 'super_admin') {
    return <SuperAdminLandingPage />;
  }
  const session = await getServerSession();
  const isLoggedIn = Boolean(session?.userId && (session?.role === 'admin' || session?.role === 'super_admin'));
  return <AdminLandingPage initialIsLoggedIn={isLoggedIn} />;
}
