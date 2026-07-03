import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { localizedField } from '@/lib/localize';
import { formatUZS } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Wishlist() {
  const { t, i18n } = useTranslation();
  const { wishlist, fetchWishlist, removeItem, moveToCart } = useWishlistStore();
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const items = wishlist?.items || [];

  async function handleRemove(productId) {
    setBusyId(productId);
    try {
      await removeItem(productId);
      toast.success(t('product.removed_from_wishlist'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveToCart(productId) {
    setBusyId(productId);
    try {
      await moveToCart(productId);
      toast.success(t('product.added_to_cart'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Heart className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-xl font-bold">{t('wishlist.empty')}</h1>
        <Button asChild>
          <Link to="/catalog">{t('cart.continue_shopping')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">{t('wishlist.title')}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => {
          const name = localizedField(item.product, 'name', i18n.language);
          const image = item.product.images?.[0]?.url;
          const busy = busyId === item.productId;

          return (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Link to={`/product/${item.product.slug}`} className="aspect-square w-full overflow-hidden bg-muted">
                {image && <img src={image} alt={name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Link to={`/product/${item.product.slug}`} className="line-clamp-2 text-xs font-medium sm:text-sm">
                  {name}
                </Link>
                <p className="text-sm font-bold">{formatUZS(item.product.discountPrice ?? item.product.price)}</p>
                <div className="mt-auto flex gap-1.5">
                  <Button size="sm" className="flex-1" disabled={busy} onClick={() => handleMoveToCart(item.productId)}>
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => handleRemove(item.productId)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
