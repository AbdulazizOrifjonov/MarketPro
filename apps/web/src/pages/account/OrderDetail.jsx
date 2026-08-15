import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
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

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];

export default function OrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!order) return <div className="py-16 text-center text-muted-foreground">{t('common.no_results')}</div>;

  const currentStepIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">#{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>{t(`order.status.${order.status}`)}</Badge>
      </div>

      {currentStepIndex >= 0 && (
        <div className="flex items-center rounded-xl border border-border bg-card p-5">
          {STATUS_FLOW.map((step, i) => (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    i <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-center text-[10px] text-muted-foreground sm:text-xs">{t(`order.status.${step}`)}</span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{t('checkout.delivery_address')}</h2>
        <p className="text-sm text-muted-foreground">
          {order.region}, {order.district}, {order.street}
        </p>
        <p className="text-sm text-muted-foreground">{order.phone}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">{t('checkout.order_summary')}</h2>
        <div className="divide-y divide-border">
          {order.items.map((item) => {
            const img = item.product?.images?.[0]?.url;
            return (
              <div key={item.id} className="flex items-center gap-3 py-3 text-sm">
                {img ? (
                  <img
                    src={img}
                    alt={item.name}
                    className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground border border-border">
                    Rasm yo'q
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Miqdor: {item.quantity} ta</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-foreground">{formatUZS(item.price * item.quantity)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.subtotal')}</span><span>{formatUZS(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-success"><span>{t('cart.discount')}</span><span>-{formatUZS(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.shipping')}</span><span>{formatUZS(order.shipping)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>{t('cart.total')}</span><span>{formatUZS(order.total)}</span></div>
        </div>
      </div>

      <Link to="/account/orders" className="text-sm font-medium text-primary hover:underline">
        ← {t('common.back')}
      </Link>
    </div>
  );
}
