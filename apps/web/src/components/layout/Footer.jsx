import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-primary/20 bg-[#065F2B] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <Logo size={32} />
              DELUX
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              O'zbekiston uchun zamonaviy onlayn-do'kon — ishonchli sifat, tez yetkazib berish.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">{t('nav.categories')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/catalog?sort=most_popular" className="hover:text-white">{t('home.popular_products')}</Link></li>
                <li><Link to="/catalog?sort=newest" className="hover:text-white">{t('home.new_products')}</Link></li>
                <li><Link to="/catalog?sort=best_selling" className="hover:text-white">{t('home.best_sellers')}</Link></li>
                <li><Link to="/catalog?onSale=true" className="hover:text-white">{t('home.discount_products')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">{t('account.profile')}</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/account/orders" className="hover:text-white">{t('account.orders')}</Link></li>
                <li><Link to="/wishlist" className="hover:text-white">{t('account.wishlist')}</Link></li>
                <li><Link to="/compare" className="hover:text-white">{t('nav.compare')}</Link></li>
                <li><Link to="/account/settings" className="hover:text-white">{t('account.settings')}</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="mb-3 text-sm font-semibold text-white">Aloqa</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href="tel:+998902155216" className="hover:text-white">+998 90 215 52 16</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href="https://t.me/delux_computer" target="_blank" rel="noopener" className="hover:text-white">@delux_computer</a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> Namangan shahar, Temir yo'l vokzali, A. Navoiy 69
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} DELUX Kompyuter & Orgtexnika. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
