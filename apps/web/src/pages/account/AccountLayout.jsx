import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Package, Heart, Bell, Clock, MapPin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountLayout() {
  const { t } = useTranslation();

  const links = [
    { to: '/account/profile', icon: User, label: t('account.profile') },
    { to: '/account/orders', icon: Package, label: t('account.orders') },
    { to: '/wishlist', icon: Heart, label: t('account.wishlist') },
    { to: '/account/addresses', icon: MapPin, label: t('account.addresses') },
    { to: '/account/notifications', icon: Bell, label: t('account.notifications') },
    { to: '/account/recently-viewed', icon: Clock, label: t('account.recently_viewed') },
    { to: '/account/settings', icon: Settings, label: t('account.settings') },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground/80'
                )
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
