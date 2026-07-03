import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryQuickBar } from '@/components/layout/CategoryQuickBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

export function StorefrontLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <TopBar />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <CategoryQuickBar />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-4 lg:px-6">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
