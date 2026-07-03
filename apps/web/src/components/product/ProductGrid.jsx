import { useTranslation } from 'react-i18next';
import { PackageSearch } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { cn } from '@/lib/utils';

export function ProductGrid({ products, isLoading, compact = false }) {
  const { t } = useTranslation();

  if (isLoading) return <ProductGridSkeleton />;

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <PackageSearch className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4',
        compact ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
