import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GitCompareArrows, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { localizedField } from '@/lib/localize';
import { formatUZS } from '@/lib/utils';
import { useCompareStore } from '@/store/compareStore';

export default function Compare() {
  const { t, i18n } = useTranslation();
  const { productIds, remove, clear } = useCompareStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api
      .get('/products/by-ids', { params: { ids: productIds.join(',') } })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setIsLoading(false));
  }, [productIds]);

  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <GitCompareArrows className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-xl font-bold">{t('common.no_results')}</h1>
        <Button asChild>
          <Link to="/catalog">{t('cart.continue_shopping')}</Link>
        </Button>
      </div>
    );
  }

  const specKeys = [...new Set(products.flatMap((p) => Object.keys(JSON.parse(p.specs || '{}'))))];

  const rows = [
    { label: t('common.currency'), render: (p) => formatUZS(p.discountPrice ?? p.price) },
    { label: t('home.brands'), render: (p) => p.brand?.name || '-' },
    {
      label: t('product.rating'),
      render: (p) => (
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating?.toFixed(1) || '-'}
        </span>
      ),
    },
    { label: t('product.in_stock'), render: (p) => (p.stock > 0 ? t('product.in_stock') : t('product.out_of_stock')) },
    ...specKeys.map((key) => ({
      label: key,
      render: (p) => JSON.parse(p.specs || '{}')[key] || '-',
    })),
  ];

  return (
    <div className="pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{t('nav.compare')}</h1>
        {products.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            {t('cart.clear_cart')}
          </Button>
        )}
      </div>

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="w-32"></th>
              {products.map((p) => (
                <th key={p.id} className="p-2 text-left align-top">
                  <div className="relative w-44 rounded-xl border border-border bg-card p-3">
                    <button
                      onClick={() => remove(p.id)}
                      className="absolute right-2 top-2 rounded-full bg-background p-1 shadow"
                      aria-label="remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link to={`/product/${p.slug}`}>
                      <img src={p.images?.[0]?.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                      <p className="mt-2 line-clamp-2 text-xs font-medium">{localizedField(p, 'name', i18n.language)}</p>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="p-2 text-sm font-medium text-muted-foreground">{row.label}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-2 text-sm">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
