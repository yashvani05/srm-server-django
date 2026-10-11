import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from '../components/layout/MobileNav';
import { SidebarContent } from '../components/layout/SidebarContent';

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-gray-200 bg-white lg:block">
        <SidebarContent />
      </aside>
      <MobileNav />

      <main id="main" className="px-4 py-6 sm:px-6 sm:py-8 lg:pl-60">
        <div key={pathname} className="mx-auto max-w-6xl animate-fade-in lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
