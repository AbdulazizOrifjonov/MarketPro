import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingCart, Minus, Plus, Loader2, Share2, GitCompareArrows, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductQA } from '@/components/product/ProductQA';
import { ProductRail } from '@/components/product/ProductRail';
import { localizedField } from '@/lib/localize';
import { formatUZS, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore, MAX_COMPARE } from '@/store/compareStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartItem = useCartStore((s) => s.cart?.items?.find((i) => i.productId === product?.id));
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const isWishlisted = useWishlistStore((s) => (product ? s.isWishlisted(product.id) : false));
  const wishlistAdd = useWishlistStore((s) => s.addItem);
  const wishlistRemove = useWishlistStore((s) => s.removeItem);

  const isComparing = useCompareStore((s) => (product ? s.isComparing(product.id) : false));
  const toggleCompare = useCompareStore((s) => s.toggleCompare);

  useDocumentTitle(product ? localizedField(product, 'name', i18n.language) : '');

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/products/${slug}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

  function requireAuth() {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  }

  async function handleAddToCart() {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await addItem(product.id, 1);
      toast.success(t('product.added_to_cart'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantityChange(delta) {
    if (!cartItem) return;
    setBusy(true);
    try {
      await updateQuantity(cartItem.id, cartItem.quantity + delta);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleWishlist() {
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
    } finally {
      setBusy(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product?.nameUz, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success(t('product.share'));
    }
  }

  function handleToggleCompare() {
    const ok = toggleCompare(product.id);
    if (!ok) toast.error(`Maksimal ${MAX_COMPARE} ta mahsulot`);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-16 text-center text-muted-foreground">{t('common.no_results')}</div>;
  }

  const name = localizedField(product, 'name', i18n.language);
  const description = localizedField(product, 'description', i18n.language);
  const specs = JSON.parse(product.specs || '{}');
  const hasDiscount = Boolean(product.discountPrice);
  const discountPercent = hasDiscount ? Math.round(100 - (product.discountPrice / product.price) * 100) : 0;
  const outOfStock = product.stock <= 0;
  const salePrice = product.discountPrice ?? product.price;

  const INSTALLMENT_OPTIONS = [
    { months: 3, markup: 0, labelKey: 'product.installment_3m' },
    { months: 6, markup: 0.05, labelKey: 'product.installment_6m' },
    { months: 12, markup: 0.12, labelKey: 'product.installment_12m' },
    { months: 24, markup: 0.25, labelKey: 'product.installment_24m' },
  ];

  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} videoUrl={product.videoUrl} name={name} />

        <div>
          {product.brand && <p className="text-sm font-medium text-primary">{product.brand.name}</p>}
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{name}</h1>

          <div className="mt-2 flex items-center gap-3">
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{product.rating?.toFixed(1)}</span>
                <span className="text-muted-foreground">({product.reviewCount} {t('product.reviews')})</span>
              </div>
            )}
            <Badge variant={outOfStock ? 'secondary' : 'success'}>
              {outOfStock ? t('product.out_of_stock') : t('product.in_stock')}
            </Badge>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold sm:text-3xl">{formatUZS(product.discountPrice ?? product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-muted-foreground line-through">{formatUZS(product.price)}</span>
                <Badge>-{discountPercent}%</Badge>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AnimatePresence mode="wait" initial={false}>
              {!cartItem ? (
                <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button size="lg" disabled={busy || outOfStock} onClick={handleAddToCart} className="min-w-[220px]">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                    {t('product.add_to_cart')}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-12 min-w-[220px] items-center gap-1.5"
                >
                  <button
                    type="button"
                    className="flex h-full flex-1 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={busy}
                    aria-label="decrease"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <motion.span key={cartItem.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="flex h-full min-w-12 items-center justify-center rounded-lg border border-primary/40 px-4 text-base font-bold tabular-nums text-primary">
                    {cartItem.quantity}
                  </motion.span>
                  <button
                    type="button"
                    className="flex h-full flex-1 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    onClick={() => handleQuantityChange(1)}
                    disabled={busy}
                    aria-label="increase"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <Button variant="outline" size="lg" onClick={handleToggleWishlist} disabled={busy}>
              <Heart className={cn('h-5 w-5', isWishlisted && 'fill-destructive text-destructive')} />
            </Button>
            <Button variant="outline" size="lg" onClick={handleToggleCompare}>
              {isComparing ? <Check className="h-5 w-5 text-primary" /> : <GitCompareArrows className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('product.installment_title')}</p>
                <p className="text-[11px] text-muted-foreground">{t('product.installment_subtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INSTALLMENT_OPTIONS.map(({ months, markup, labelKey }) => {
                const monthly = Math.ceil((salePrice * (1 + markup)) / months);
                return (
                  <div
                    key={months}
                    className="group flex flex-col items-center rounded-lg border border-border bg-background px-2 py-2.5 text-center transition-all hover:border-primary/50"
                  >
                    <span className="rounded-full bg-primary/10 px-2 py-px text-[11px] font-semibold text-primary">{t(labelKey)}</span>
                    <span className="mt-1 text-sm font-bold text-foreground">{formatUZS(monthly)}</span>
                    <span className="text-[10px] text-muted-foreground">{t('product.installment_monthly')}</span>
                    {markup > 0 && <span className="text-[10px] text-muted-foreground">+{Math.round(markup * 100)}%</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
            <Tabs defaultValue="description">
              <div className="border-b border-border px-1">
                <TabsList className="h-12 w-full justify-start gap-0 rounded-none bg-transparent p-0 overflow-x-auto scrollbar-hide">
                  <TabsTrigger value="description" className="relative h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{t('product.description')}</TabsTrigger>
                  <TabsTrigger value="specs" className="relative h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{t('product.specifications')}</TabsTrigger>
                  <TabsTrigger value="reviews" className="relative h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{t('product.reviews')} ({product.reviewCount || 0})</TabsTrigger>
                  <TabsTrigger value="qa" className="relative h-12 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">{t('product.questions_answers')}</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-5 sm:p-6">
                <TabsContent value="description" className="mt-0">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{description}</p>
                </TabsContent>

                <TabsContent value="specs" className="mt-0">
                  <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 px-4 py-3 text-sm odd:bg-muted/30">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </TabsContent>

                <TabsContent value="reviews" className="mt-0">
                  <ProductReviews slug={slug} />
                </TabsContent>

                <TabsContent value="qa" className="mt-0">
                  <ProductQA slug={slug} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

        </div>
      </div>

      <ProductRail title={t('product.frequently_bought')} endpoint={`/products/${slug}/frequently-bought-together`} />
      <ProductRail title={t('product.similar_products')} endpoint={`/products/${slug}/similar`} />
      <ProductRail title={t('product.related_products')} endpoint={`/products/${slug}/related`} />
      {isAuthenticated && <ProductRail title={t('product.recently_viewed')} endpoint="/products/recently-viewed" />}
    </div>
  );
}
