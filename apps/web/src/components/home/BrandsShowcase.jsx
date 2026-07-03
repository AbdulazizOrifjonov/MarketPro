import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export function BrandsShowcase() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/brands')
      .then(({ data }) => setBrands(data.brands))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && brands.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold sm:text-xl">{t('home.brands')}</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-28 shrink-0 rounded-xl" />)
          : brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/catalog?brand=${brand.id}`}
                className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="h-8 object-contain" /> : brand.name}
              </Link>
            ))}
      </div>
    </section>
  );
}
