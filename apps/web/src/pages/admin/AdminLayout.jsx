import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users, Image, Tag, BarChart3,
  ArrowLeft, Crown, PanelLeftClose, PanelLeftOpen, Menu, X, Zap, Star, Aperture,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function AdminLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [adminCount, setAdminCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.adminLevel === 'SUPER_ADMIN') {
      api
        .get('/admin-users')
        .then(({ data }) => {
          const assistantAdmins = (data.admins || []).filter(
            (a) => a.adminLevel === 'ASSISTANT_ADMIN'
          ).length;
          setAdminCount(assistantAdmins);
        })
        .catch(() => {});
    }
  }, [user]);

  const baseLinks = [
    { to: '/admin', icon: LayoutDashboard, label: t('admin.dashboard'), end: true },
    { to: '/admin/products', icon: Package, label: t('admin.products') },
    { to: '/admin/categories', icon: FolderTree, label: t('admin.categories') },
    { to: '/admin/brands', icon: Aperture, label: 'Brendlar' },
    { to: '/admin/orders', icon: ShoppingBag, label: t('admin.orders') },
    { to: '/admin/users', icon: Users, label: t('admin.users') },
    { to: '/admin/reviews', icon: Star, label: 'Sharhlar' },
    { to: '/admin/sliders', icon: Image, label: t('admin.sliders') },
    { to: '/admin/coupons', icon: Tag, label: t('admin.coupons') },
    { to: '/admin/flash-sale', icon: Zap, label: t('admin.flash_sale') },
    { to: '/admin/analytics', icon: BarChart3, label: t('admin.analytics') },
  ];

  const links = user?.adminLevel === 'SUPER_ADMIN'
    ? [...baseLinks, {
        to: '/admin/admin-users',
        icon: Crown,
        label: `Yordamchi admin (${adminCount})`
      }]
    : baseLinks;

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-60';

  function SidebarContent({ isMobile = false }) {
    return (
      <>
        <div className="flex h-14 items-center border-b border-border px-3">
          {collapsed && !isMobile ? (
            <button
              onClick={() => setCollapsed(false)}
              className="mx-auto cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-accent"
              title="Sidebar ochish"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Logo size={28} />
                <span>Admin</span>
              </div>
              {isMobile ? (
                <button
                  onClick={() => setMobileOpen(false)}
                  className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => setCollapsed(true)}
                  className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                  title="Sidebar yopish"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed && !isMobile
                    ? 'justify-center p-2.5'
                    : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:bg-accent'
                )
              }
              title={collapsed && !isMobile ? label : undefined}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          <Link
            to="/"
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent',
              collapsed && !isMobile ? 'justify-center p-2.5' : 'gap-2 px-3 py-2'
            )}
            title={collapsed && !isMobile ? 'Saytga qaytish' : undefined}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span>Saytga qaytish</span>}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className={cn('hidden lg:block shrink-0 transition-all duration-200', sidebarWidth)}>
        <div className={cn(
          'fixed top-0 left-0 z-30 flex h-svh flex-col border-r border-border bg-card transition-all duration-200',
          sidebarWidth
        )}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 z-50 flex h-svh w-64 flex-col border-r border-border bg-card shadow-xl">
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/" className="text-sm text-primary hidden sm:block">Saytga qaytish</Link>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
