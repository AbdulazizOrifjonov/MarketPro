import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Menu, Search, Heart, ShoppingCart, User, LogOut, Package, Shield, GitCompareArrows, Moon, Sun, LayoutGrid, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SearchBox } from '@/components/layout/SearchBox';
import { CatalogMegaMenu } from '@/components/layout/CatalogMegaMenu';
import { Logo } from '@/components/layout/Logo';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore } from '@/store/compareStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export function Navbar({ onMenuClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0);
  const wishlistCount = useWishlistStore((s) => s.wishlist?.items?.length || 0);
  const compareCount = useCompareStore((s) => s.productIds.length);
  const { theme, toggleTheme } = useUiStore();

  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-3 sm:px-4 lg:px-6">
        <button
          className="rounded-lg p-2 hover:bg-accent lg:hidden"
          onClick={onMenuClick}
          aria-label="open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-lg sm:text-xl">
          <Logo size={32} />
          <span className="hidden sm:inline">MarketPro</span>
        </Link>

        <button
          onClick={() => setCatalogOpen((v) => !v)}
          className={cn(
            'hidden shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors lg:flex',
            catalogOpen ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/15'
          )}
        >
          {catalogOpen ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          {t('nav.categories')}
        </button>

        <div className="mx-1 hidden flex-1 max-w-xl sm:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <button
            className="rounded-lg p-2 hover:bg-accent sm:hidden"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="hidden rounded-lg p-2 hover:bg-accent sm:flex"
            aria-label="toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <LanguageSwitcher />

          <Link to="/compare" className="relative hidden rounded-lg p-2 hover:bg-accent sm:flex" aria-label={t('nav.compare')}>
            <GitCompareArrows className="h-5 w-5" />
            {compareCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {compareCount}
              </span>
            )}
          </Link>

          <Link to="/wishlist" className="relative rounded-lg p-2 hover:bg-accent" aria-label={t('nav.wishlist')}>
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative rounded-lg p-2 hover:bg-accent" aria-label={t('nav.cart')}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="ml-1 rounded-full" aria-label="account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[200px] rounded-lg border border-border bg-popover p-1 shadow-lg"
                >
                  <DropdownMenu.Item asChild>
                    <Link to="/account/profile" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent">
                      <User className="h-4 w-4" /> {t('nav.profile')}
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link to="/account/orders" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent">
                      <Package className="h-4 w-4" /> {t('account.orders')}
                    </Link>
                  </DropdownMenu.Item>
                  {user?.role === 'ADMIN' && (
                    <DropdownMenu.Item asChild>
                      <Link to="/admin" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent">
                        <Shield className="h-4 w-4" /> {t('nav.admin_panel')}
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" /> {t('nav.logout')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="ml-1 flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      {mobileSearchOpen && (
        <div className="border-t border-border bg-background p-3 sm:hidden">
          <SearchBox onNavigate={() => setMobileSearchOpen(false)} />
        </div>
      )}

      <CatalogMegaMenu open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </header>
  );
}
