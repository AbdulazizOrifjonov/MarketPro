import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUZS } from '@/lib/utils';

function ProductRankList({ items, valueLabel, getValue }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <div className="space-y-2">
      {items.map((entry, i) => {
        const product = entry.product || entry;
        return (
          <div key={product.id} className="flex items-center gap-2 text-sm">
            <span className="w-5 text-muted-foreground">{i + 1}.</span>
            <img src={product.images?.[0]?.url} alt="" className="h-8 w-8 rounded-md object-cover" />
            <span className="line-clamp-1 flex-1">{product.nameUz}</span>
            <span className="shrink-0 font-medium">{getValue(entry)} {valueLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const [topProducts, setTopProducts] = useState(null);
  const [topOther, setTopOther] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics/top-products').then(({ data }) => setTopProducts(data));
    api.get('/admin/analytics/top-categories-customers').then(({ data }) => setTopOther(data));
  }, []);

  if (!topProducts || !topOther) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t('admin.analytics')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p ko'rilganlar</CardTitle></CardHeader>
          <CardContent>
            <ProductRankList items={topProducts.mostViewed} valueLabel="ko'rish" getValue={(p) => p.viewCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p sotilganlar</CardTitle></CardHeader>
          <CardContent>
            <ProductRankList items={topProducts.mostSold} valueLabel="dona" getValue={(p) => p.soldCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p sevimlilarga qo'shilgan</CardTitle></CardHeader>
          <CardContent>
            <ProductRankList items={topProducts.mostWishlisted} valueLabel="marta" getValue={(e) => e.count} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eng ko'p savatchaga qo'shilgan</CardTitle></CardHeader>
          <CardContent>
            <ProductRankList items={topProducts.mostCarted} valueLabel="marta" getValue={(e) => e.count} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top kategoriyalar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topOther.topCategories.map((entry, i) => (
                <div key={entry.category.id} className="flex items-center justify-between text-sm">
                  <span>{i + 1}. {entry.category.nameUz}</span>
                  <span className="font-medium">{formatUZS(entry.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top mijozlar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topOther.topCustomers.map((entry, i) => (
                <div key={entry.user?.id || i} className="flex items-center justify-between text-sm">
                  <span>{i + 1}. {entry.user?.name}</span>
                  <span className="font-medium">{formatUZS(entry.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
