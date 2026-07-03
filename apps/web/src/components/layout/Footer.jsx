import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <Logo size={32} />
              MarketPro
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              O'zbekiston uchun zamonaviy onlayn-do'kon — ishonchli sifat, tez yetkazib berish.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t('nav.categories')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/catalog?sort=most_popular" className="hover:text-primary">{t('home.popular_products')}</Link></li>
                <li><Link to="/catalog?sort=newest" className="hover:text-primary">{t('home.new_products')}</Link></li>
                <li><Link to="/catalog?sort=best_selling" className="hover:text-primary">{t('home.best_sellers')}</Link></li>
                <li><Link to="/catalog?onSale=true" className="hover:text-primary">{t('home.discount_products')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t('account.profile')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/account/orders" className="hover:text-primary">{t('account.orders')}</Link></li>
                <li><Link to="/wishlist" className="hover:text-primary">{t('account.wishlist')}</Link></li>
                <li><Link to="/compare" className="hover:text-primary">{t('nav.compare')}</Link></li>
                <li><Link to="/account/settings" className="hover:text-primary">{t('account.settings')}</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="mb-3 text-sm font-semibold">Aloqa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href="tel:+998712000000" className="hover:text-primary">+998 71 200 00 00</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href="mailto:support@marketpro.uz" className="hover:text-primary">support@marketpro.uz</a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> Toshkent, O'zbekiston
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MarketPro Uzbekistan. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
