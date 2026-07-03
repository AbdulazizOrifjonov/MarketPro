import { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { localizedField } from '@/lib/localize';
import { formatUZS, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export const ProductCard = memo(function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const cartItem = useCartStore((s) => s.cart?.items?.find((i) => i.productId === product.id));
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const wishlistAdd = useWishlistStore((s) => s.addItem);
  const wishlistRemove = useWishlistStore((s) => s.removeItem);

  const [busy, setBusy] = useState(false);

  const name = localizedField(product, 'name', i18n.language);
  const image = product.images?.[0]?.url;
  const hasDiscount = Boolean(product.discountPrice);
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.discountPrice / product.price) * 100)
    : 0;
  const outOfStock = product.stock <= 0;

  function requireAuth() {
    if (!isAuthenticated) {
      toast.info(t('auth.login_title'));
      navigate('/login');
      return false;
    }
    return true;
  }

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await addItem(product.id, 1);
      toast.success(t('product.added_to_cart'));
    } catch {
      toast.error(t('common.error_occurred'));
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantityChange(e, delta) {
    e.preventDefault();
    if (!cartItem) return;
    const nextQty = cartItem.quantity + delta;
    setBusy(true);
    try {
      await updateQuantity(cartItem.id, nextQty);
      if (nextQty <= 0) toast.success(t('product.removed_from_cart'));
    } catch {
      toast.error(t('common.error_occurred'));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleWishlist(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    setBusy(true);
    try {
      if (isWishlisted) {
        await wishlistRemove(product.id);
        toast.success(t('product.removed_from_wishlist'));
      } else {
        await wishlistAdd(product.id);
        toast.success(t('product.added_to_wishlist'));
      }
    } catch {
      toast.error(t('common.error_occurred'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No image</div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && <Badge>-{discountPercent}%</Badge>}
          {outOfStock && <Badge variant="secondary">{t('product.out_of_stock')}</Badge>}
        </div>

        <button
          onClick={handleToggleWishlist}
          disabled={busy}
          aria-label="wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-black/60"
        >
          <Heart className={cn('h-4 w-4', isWishlisted ? 'fill-destructive text-destructive' : 'text-foreground/70')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-[2.5em] text-xs font-medium leading-tight sm:text-sm">{name}</h3>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.rating?.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold sm:text-base">{formatUZS(product.discountPrice ?? product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{formatUZS(product.price)}</span>
          )}
        </div>

        <div className="mt-1.5" onClick={(e) => e.preventDefault()}>
          <AnimatePresence mode="wait" initial={false}>
            {!cartItem ? (
              <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  size="sm"
                  className="w-full gap-1 px-1.5"
                  disabled={busy || outOfStock}
                  onClick={handleAddToCart}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="hidden truncate text-[11px] leading-none sm:inline">{t('product.add_to_cart')}</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex h-8 w-full items-center gap-1.5"
              >
                <button
                  type="button"
                  className="flex h-full flex-1 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  onClick={(e) => handleQuantityChange(e, -1)}
                  disabled={busy}
                  aria-label="decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <motion.span
                  key={cartItem.quantity}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="flex h-full min-w-8 items-center justify-center rounded-md border border-primary/40 px-2 text-sm font-bold tabular-nums text-primary"
                >
                  {cartItem.quantity}
                </motion.span>
                <button
                  type="button"
                  className="flex h-full flex-1 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  onClick={(e) => handleQuantityChange(e, 1)}
                  disabled={busy}
                  aria-label="increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
});
