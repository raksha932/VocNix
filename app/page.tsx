import { getAppMode } from '@/lib/config/app-mode';
import AdminLandingPage from '@/components/landing/AdminLandingPage';
import SuperAdminLandingPage from '@/components/landing/SuperAdminLandingPage';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const mode = getAppMode();
  if (mode === 'super_admin') {
    return <SuperAdminLandingPage />;
  }
  return <AdminLandingPage />;
}
