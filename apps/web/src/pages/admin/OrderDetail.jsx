import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Mail, MapPin, Package, CreditCard, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatUZS } from '@/lib/utils';

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const STATUS_VARIANT = {
  PENDING: 'secondary', CONFIRMED: 'default', SHIPPING: 'default',
  DELIVERED: 'success', CANCELLED: 'destructive', REFUNDED: 'destructive',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/orders/admin/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => {
        toast.error(err.friendlyMessage || 'Buyurtma topilmadi');
        navigate('/admin/orders');
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  async function updateStatus(status) {
    try {
      await api.patch(`/orders/admin/${id}/status`, { status });
      toast.success('Holat yangilandi');
      setOrder((prev) => ({ ...prev, status }));
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">#{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Mijoz ma'lumotlari</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Ism</p>
              <p className="font-medium">{order.user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${order.user.phone}`} className="text-sm text-primary hover:underline">
                {order.user.phone || '—'}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${order.user.email}`} className="text-sm text-primary hover:underline">
                {order.user.email || '—'}
              </a>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Yetkazib berish manzili</h2>
          <div className="flex gap-2 text-sm">
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">{order.region}</p>
              <p className="text-muted-foreground">{order.district}</p>
              <p className="font-medium">{order.street}</p>
            </div>
          </div>
        </div>

        {/* Payment & Status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Holat va to'lov</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">To'lov usuli</p>
              <Badge variant="outline">{t(`order.payment.${order.paymentMethod}`)}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Holati</p>
              <Select value={order.status} onValueChange={updateStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {t(`order.status.${order.status}`)}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`order.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Package className="h-5 w-5" />
            Mahsulotlar ({order.items.length} ta)
          </h2>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-5">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {item.product?.sku || '—'}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.quantity} x {formatUZS(item.price)}</p>
                <p className="text-sm text-muted-foreground">{formatUZS(item.quantity * item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jami narx:</span>
            <span>{formatUZS(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Chegirma:</span>
              <span>-{formatUZS(order.discount)}</span>
            </div>
          )}
          {order.shipping > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yetkazib berish:</span>
              <span>{formatUZS(order.shipping)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Soliq:</span>
              <span>{formatUZS(order.tax)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
            <span>Jami:</span>
            <span>{formatUZS(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
