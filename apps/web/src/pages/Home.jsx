import { useTranslation } from 'react-i18next';
import { HeroSlider } from '@/components/home/HeroSlider';
import { ProductSection } from '@/components/home/ProductSection';
import { CategoriesShowcase } from '@/components/home/CategoriesShowcase';
import { BrandsShowcase } from '@/components/home/BrandsShowcase';
import { FlashSale } from '@/components/home/FlashSale';
import { TrustBadges } from '@/components/home/TrustBadges';
import { Testimonials } from '@/components/home/Testimonials';
import { Reveal } from '@/components/common/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Home() {
  const { t } = useTranslation();
  useDocumentTitle('');

  return (
    <div className="pb-8">
      <HeroSlider />

      <Reveal>
        <TrustBadges />
      </Reveal>

      <CategoriesShowcase />
      <FlashSale />

      <ProductSection title={t('home.popular_products')} params={{ sort: 'most_popular' }} viewAllHref="/catalog?sort=most_popular" />
      <ProductSection title={t('home.new_products')} params={{ sort: 'newest' }} viewAllHref="/catalog?sort=newest" />
      <ProductSection title={t('home.best_sellers')} params={{ sort: 'best_selling' }} viewAllHref="/catalog?sort=best_selling" />
      <ProductSection title={t('home.recommended')} params={{ featured: 'true' }} viewAllHref="/catalog?featured=true" />

      <Reveal>
        <Testimonials />
      </Reveal>

      <BrandsShowcase />
    </div>
  );
}
