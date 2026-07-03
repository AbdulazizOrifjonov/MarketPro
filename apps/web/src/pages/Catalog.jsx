import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FiltersPanel } from '@/components/catalog/FiltersPanel';
import { SortDropdown } from '@/components/catalog/SortDropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Catalog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const debouncedQuery = useDebounce(filters.q || '', 400);
  useDocumentTitle(filters.q ? `"${filters.q}"` : t('nav.categories'));

  function updateFilters(next) {
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== ''));
    setSearchParams(cleaned);
  }

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    const params = { ...filters, q: debouncedQuery || undefined, page: filters.page || 1 };
    api
      .get('/products', { params })
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...filters, q: debouncedQuery })]);

  function goToPage(page) {
    updateFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="pb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold sm:text-2xl">
          {filters.q ? `"${filters.q}"` : t('nav.categories')}
          {!isLoading && <span className="ml-2 text-sm font-normal text-muted-foreground">({pagination.total})</span>}
        </h1>
        <div className="flex items-center gap-2">
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> {t('common.filter')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('common.filter')}</DialogTitle>
              </DialogHeader>
              <FiltersPanel filters={filters} onChange={(f) => { updateFilters(f); }} />
            </DialogContent>
          </Dialog>
          <SortDropdown value={filters.sort || 'newest'} onChange={(sort) => updateFilters({ ...filters, sort })} />
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FiltersPanel filters={filters} onChange={updateFilters} />
        </aside>

        <div className="min-w-0 flex-1">
          <ProductGrid products={products} isLoading={isLoading} compact />

          {!isLoading && pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-1.5">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${
                    Number(filters.page || 1) === i + 1 ? 'bg-primary text-primary-foreground' : 'border border-input hover:bg-accent'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
