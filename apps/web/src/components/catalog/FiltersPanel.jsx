import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { localizedField } from '@/lib/localize';
import { cn } from '@/lib/utils';

export function FiltersPanel({ filters, onChange }) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  useEffect(() => {
    api.get('/categories/tree').then(({ data }) => setCategories(data.categories));
    api.get('/brands').then(({ data }) => setBrands(data.brands));
  }, []);

  function flatCategories(list, depth = 0) {
    return list.flatMap((c) => [{ ...c, depth }, ...flatCategories(c.children || [], depth + 1)]);
  }
  const allCategories = flatCategories(categories);

  function applyPriceRange() {
    onChange({ ...filters, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined });
  }

  function toggleBrand(brandId) {
    onChange({ ...filters, brand: filters.brand === brandId ? undefined : brandId });
  }

  function selectCategory(slug) {
    onChange({ ...filters, category: filters.category === slug ? undefined : slug });
  }

  function setRating(rating) {
    onChange({ ...filters, minRating: filters.minRating === String(rating) ? undefined : String(rating) });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('nav.categories')}</h3>
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.slug)}
              style={{ paddingLeft: `${cat.depth * 12}px` }}
              className={cn(
                'block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                filters.category === cat.slug && 'bg-primary/10 font-medium text-primary'
              )}
            >
              {localizedField(cat, 'name', i18n.language)}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Narx</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="h-9"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('home.brands')}</h3>
        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={filters.brand === brand.id} onCheckedChange={() => toggleBrand(brand.id)} />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('product.rating')}</h3>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={cn(
                'flex w-full items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent',
                filters.minRating === String(r) && 'bg-primary/10'
              )}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('h-3.5 w-3.5', i < r ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
              ))}
              <span className="ml-1 text-muted-foreground">& up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.inStock === 'true'}
            onCheckedChange={(v) => onChange({ ...filters, inStock: v ? 'true' : undefined })}
          />
          {t('product.in_stock')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.onSale === 'true'}
            onCheckedChange={(v) => onChange({ ...filters, onSale: v ? 'true' : undefined })}
          />
          {t('home.discount_products')}
        </label>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={() => onChange({})}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}
