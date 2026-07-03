import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressForm } from '@/components/account/AddressForm';
import { formatUZS, cn } from '@/lib/utils';
import { localizedField } from '@/lib/localize';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

const SHIPPING_FEE = 25000;

const PAYMENT_METHODS = [
  { value: 'CASH_ON_DELIVERY', labelKey: 'checkout.cash_on_delivery' },
  { value: 'CARD', labelKey: 'checkout.card' },
  { value: 'CLICK', label: 'Click' },
  { value: 'PAYME', label: 'Payme' },
];

function formatAddress(addr) {
  return [addr.region, addr.district, addr.neighborhood, addr.street, addr.houseNumber && `${addr.houseNumber}-uy`]
    .filter(Boolean)
    .join(', ');
}

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { cart, fetchCart, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [coupon, setCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart();
    api.get('/users/me/addresses').then(({ data }) => {
      setAddresses(data.addresses);
      const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
      if (def) setSelectedAddressId(def.id);
      else setShowNewAddress(true);
    });

    const couponCode = sessionStorage.getItem('marketpro_coupon');
    if (couponCode) {
      api
        .post('/coupons/validate', { code: couponCode })
        .then(({ data }) => setCoupon(data.coupon))
        .catch(() => sessionStorage.removeItem('marketpro_coupon'));
    }
  }, [fetchCart]);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const discount = coupon
    ? Math.min(coupon.type === 'PERCENT' ? subtotal * (coupon.value / 100) : coupon.value, subtotal)
    : 0;
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal - discount + shipping;

  async function handleSaveNewAddress(form) {
    setIsSavingAddress(true);
    try {
      const { data } = await api.post('/users/me/addresses', { ...form, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, data.address]);
      setSelectedAddressId(data.address.id);
      setShowNewAddress(false);
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handlePlaceOrder() {
    setError('');
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) {
      setError(t('checkout.delivery_address'));
      return;
    }
    if (!phone || !/^\+998\d{9}$/.test(phone)) {
      setError('Telefon formati: +998901234567');
      return;
    }
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const streetDetail = [address.neighborhood, address.street, address.houseNumber && `${address.houseNumber}-uy`]
        .filter(Boolean)
        .join(', ');
      const { data } = await api.post('/orders', {
        region: address.region,
        district: address.district,
        street: streetDetail,
        phone,
        paymentMethod,
        couponCode: coupon?.code,
      });
      sessionStorage.removeItem('marketpro_coupon');
      await clearCart();
      toast.success(t('checkout.order_success'));
      navigate(`/account/orders/${data.order.id}`);
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">{t('cart.empty')}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="text-xl font-bold sm:text-2xl">{t('checkout.title')}</h1>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">{t('checkout.customer_info')}</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('auth.phone')}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">{t('checkout.delivery_address')}</h2>
          <div className="space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => {
                  setSelectedAddressId(addr.id);
                  setShowNewAddress(false);
                }}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm',
                  selectedAddressId === addr.id && !showNewAddress ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{formatAddress(addr)}</span>
              </button>
            ))}

            {!showNewAddress ? (
              <Button variant="outline" size="sm" onClick={() => setShowNewAddress(true)}>
                <Plus className="h-4 w-4" /> {t('account.add_address')}
              </Button>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-3">
                <AddressForm onSave={handleSaveNewAddress} onCancel={() => setShowNewAddress(false)} saving={isSavingAddress} />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">{t('checkout.payment_method')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  'rounded-lg border p-3 text-sm font-medium',
                  paymentMethod === method.value ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                )}
              >
                {method.labelKey ? t(method.labelKey) : method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">{t('checkout.order_summary')}</h2>
          <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <img src={item.product.images?.[0]?.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1">{localizedField(item.product, 'name', i18n.language)}</p>
                  <p className="text-muted-foreground">x{item.quantity}</p>
                </div>
                <p className="shrink-0 font-medium">{formatUZS((item.product.discountPrice ?? item.product.price) * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('cart.subtotal')}</span>
              <span>{formatUZS(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>{t('cart.discount')}</span>
                <span>-{formatUZS(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('cart.shipping')}</span>
              <span>{formatUZS(shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t('cart.total')}</span>
              <span>{formatUZS(total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <Button size="lg" className="mt-4 w-full" disabled={isSubmitting} onClick={handlePlaceOrder}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('checkout.place_order')}
          </Button>
        </div>
      </div>
    </div>
  );
}
