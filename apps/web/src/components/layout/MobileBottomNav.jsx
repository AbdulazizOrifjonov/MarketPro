import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, ShoppingCart, Heart, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartCount = useCartStore((s) => s.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0);
  const wishlistCount = useWishlistStore((s) => s.wishlist?.items?.length || 0);

  const navItems = [
    { label: t('nav.home', 'Bosh sahifa'), path: '/', icon: Home },
    { label: t('nav.catalog', 'Katalog'), path: '/catalog', icon: Compass },
    {
      label: t('nav.cart', 'Savatcha'),
      path: '/cart',
      icon: ShoppingCart,
      badge: cartCount,
    },
    {
      label: t('nav.wishlist', 'Saralangan'),
      path: '/wishlist',
      icon: Heart,
      badge: wishlistCount,
    },
    {
      label: isAuthenticated ? t('nav.profile', 'Profil') : t('nav.login', 'Kirish'),
      path: isAuthenticated ? '/account/profile' : '/login',
      icon: User,
    },
  ];

  return (
    <nav aria-label="mobile navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn('relative rounded-full p-1.5 transition-colors', isActive && 'bg-primary/15')}>
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                {Boolean(item.badge) && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
