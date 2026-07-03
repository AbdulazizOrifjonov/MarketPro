import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localizedField } from '@/lib/localize';
import { formatUZS } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

const SHIPPING_FEE = 25000;
const FREE_SHIPPING_MIN = 500000;

export default function Cart() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { cart, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const [busyItemId, setBusyItemId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const discount = coupon
    ? Math.min(coupon.type === 'PERCENT' ? subtotal * (coupon.value / 100) : coupon.value, subtotal)
    : 0;
  const shipping = items.length > 0 ? (subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE) : 0;
  const total = subtotal - discount + shipping;

  async function handleQuantityChange(item, delta) {
    setBusyItemId(item.id);
    try {
      await updateQuantity(item.id, item.quantity + delta);
      if (item.quantity + delta <= 0) toast.success(t('product.removed_from_cart'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(item) {
    setBusyItemId(item.id);
    try {
      await removeItem(item.id);
      toast.success(t('product.removed_from_cart'));
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleClearCart() {
    if (!confirm(t('cart.clear_cart') + '? ' + t('common.confirm'))) return;
    await clearCart();
    setCoupon(null);
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode.trim().toUpperCase(), subtotal });
      setCoupon(data.coupon);
      toast.success(t('checkout.apply_coupon'));
    } catch (err) {
      setCouponError(err.friendlyMessage);
      setCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleCheckout() {
    if (coupon) sessionStorage.setItem('marketpro_coupon', coupon.code);
    else sessionStorage.removeItem('marketpro_coupon');
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShoppingBag className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-xl font-bold">{t('cart.empty')}</h1>
        <Button asChild>
          <Link to="/catalog">{t('cart.continue_shopping')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold sm:text-2xl">{t('cart.title')}</h1>
          <Button variant="ghost" size="sm" onClick={handleClearCart}>
            <Trash2 className="h-4 w-4" /> {t('cart.clear_cart')}
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const name = localizedField(item.product, 'name', i18n.language);
            const price = item.product.discountPrice ?? item.product.price;
            const image = item.product.images?.[0]?.url;
            const busy = busyItemId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <Link to={`/product/${item.product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
                  {image && <img src={image} alt={name} className="h-full w-full object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary sm:text-base">
                      {name}
                    </Link>
                    <p className="mt-1 text-sm font-bold">{formatUZS(price)}</p>
                  </div>
                    <div className="flex items-center justify-between">
                      <AnimatePresence mode="wait" initial={false}>
                        {!busy ? (
                          <motion.div
                            key="stepper"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex h-8 items-center gap-1.5"
                          >
                            <button
                              type="button"
                              className="flex h-full w-12 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={busy}
                              aria-label="decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="flex h-full min-w-10 items-center justify-center rounded-md border border-primary/40 px-3 text-sm font-bold tabular-nums text-primary"
                            >
                              {item.quantity}
                            </motion.span>
                            <button
                              type="button"
                              className="flex h-full w-12 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={busy}
                              aria-label="increase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="loader"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex h-8 w-[160px] items-center justify-center"
                          >
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button onClick={() => handleRemove(item)} disabled={busy} className="cursor-pointer text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">{t('checkout.order_summary')}</h2>

          <div className="mb-4 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder={t('checkout.coupon_code')}
            />
            <Button variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon}>
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          {couponError && <p className="mb-3 text-xs text-destructive">{couponError}</p>}
          {coupon && <p className="mb-3 text-xs text-success">{coupon.code} ✓</p>}

          <div className="space-y-2 text-sm">
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
              <span>{shipping === 0 ? <span className="text-success">Bepul</span> : formatUZS(shipping)}</span>
            </div>
            {shipping > 0 && subtotal < FREE_SHIPPING_MIN && (
              <p className="text-xs text-muted-foreground">Yetkazib berish bepul: {formatUZS(FREE_SHIPPING_MIN - subtotal)} qoldi</p>
            )}
          </div>

          <div className="my-4 border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t('cart.total')}</span>
              <span>{formatUZS(total)}</span>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={handleCheckout}>
            {t('cart.checkout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
