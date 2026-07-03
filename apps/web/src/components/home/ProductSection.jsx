import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, RotateCw } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export function ProductSection({ title, params, viewAllHref }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(false);
    api
      .get('/products', { params: { limit: 10, ...params } })
      .then(({ data }) => active && setProducts(data.products))
      .catch(() => active && setError(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [JSON.stringify(params), reloadKey]);

  if (error) {
    return (
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold sm:text-xl">{title}</h2>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-10 text-center">
          <p className="text-sm text-muted-foreground">{t('common.error_occurred')}</p>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="h-4 w-4" /> {t('common.try_again')}
          </Button>
        </div>
      </section>
    );
  }

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {viewAllHref && (
          <Link to={viewAllHref} className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
            {t('common.view_all')} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <ProductGrid products={products} isLoading={isLoading} />
    </section>
  );
}
