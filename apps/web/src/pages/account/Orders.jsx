import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUZS } from '@/lib/utils';

const STATUS_VARIANT = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  SHIPPING: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{t('account.orders')}</h1>
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/account/orders/${order.id}`}
          className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">#{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge variant={STATUS_VARIANT[order.status]}>{t(`order.status.${order.status}`)}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{order.items.length} {t('account.orders').toLowerCase()}</span>
            <span className="font-bold">{formatUZS(order.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
