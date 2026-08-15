import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, ChevronLeft, ChevronRight, Search, ArrowUpDown, Image as ImageIcon, MessageSquare, Award } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminReviews() {
  const [activeTab, setActiveTab] = useState('ratings');
  
  // Reviews List State
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  // Product Ratings State
  const [productRatings, setProductRatings] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (high to low) or 'asc' (low to high)
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);

  // Photo Lightbox
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  function loadReviews(p = 1) {
    setIsLoadingReviews(true);
    api
      .get('/reviews/all', { params: { page: p, limit: 30, search } })
      .then(({ data }) => {
        setReviews(data.reviews || []);
        setPages(data.pagination?.pages || 1);
        setPage(data.pagination?.page || 1);
      })
      .catch(() => {})
      .finally(() => setIsLoadingReviews(false));
  }

  function loadProductRatings(order = sortOrder) {
    setIsLoadingRatings(true);
    api
      .get('/reviews/product-ratings', { params: { sort: order } })
      .then(({ data }) => {
        setProductRatings(data.productRatings || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingRatings(false));
  }

  useEffect(() => {
    loadProductRatings(sortOrder);
    loadReviews(1);
  }, []);

  function handleSortToggle() {
    const newSort = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSort);
    loadProductRatings(newSort);
  }

  async function handleDeleteReview(id) {
    if (!confirm("Ushbu sharhni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Sharh o'chirildi");
      loadReviews(page);
      loadProductRatings(sortOrder);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    }
  }

  const filteredRatings = productRatings.filter((p) =>
    p.nameUz.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={selectedPhoto} alt="Review attachment" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            Sharhlar & Mahsulotlar Reytingi
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Foydalanuvchilarning mahsulotlar uchun qoldirgan baholari, 3 ta rasm va kommentariylari
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/60 p-1 rounded-2xl">
          <TabsTrigger value="ratings" className="rounded-xl font-bold text-xs sm:text-sm">
            <Award className="h-4 w-4 mr-1.5 text-primary" />
            Mahsulotlar Reytingi ({productRatings.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl font-bold text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1.5 text-primary" />
            Barcha Sharhlar ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PRODUCT RATINGS RANKING */}
        <TabsContent value="ratings" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Mahsulot yoki kategoriya bo'yicha qidirish..."
                className="pl-9 rounded-xl text-xs"
              />
            </div>

            <Button
              onClick={handleSortToggle}
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 w-full sm:w-auto"
            >
              <ArrowUpDown className="h-4 w-4" />
              Saralash: {sortOrder === 'desc' ? "⭐ Reyting: Eng yuqori (Kamayish)" : "⭐ Reyting: Eng past (O'sish)"}
            </Button>
          </div>

          {isLoadingRatings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <Star className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-muted-foreground">Mahsulotlar topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRatings.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs hover:border-primary/40 transition-all">
                  <div className="flex gap-4 items-start">
                    <img
                      src={p.imageUrl || '/placeholder.png'}
                      alt={p.nameUz}
                      className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        {p.categoryName}
                      </span>
                      <Link to={`/product/${p.slug}`} className="block font-bold text-sm text-foreground hover:text-primary truncate">
                        {p.nameUz}
                      </Link>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {p.price?.toLocaleString()} so'm
                      </p>
                    </div>

                    {/* Rating Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                          {p.avgRating > 0 ? p.avgRating : 'Yangi'}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {p.totalReviews} ta sharh
                      </span>
                    </div>
                  </div>

                  {/* Rating Breakdown Bar */}
                  <div className="space-y-1 pt-2 border-t border-border/60">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = p.starCounts?.[star] || 0;
                      const percent = p.totalReviews > 0 ? Math.round((count / p.totalReviews) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center text-[11px] gap-2">
                          <span className="w-6 font-bold text-muted-foreground">{star}★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ALL REVIEWS LIST WITH PHOTOS */}
        <TabsContent value="reviews" className="mt-6 space-y-4">
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadReviews(1);
                }}
                placeholder="Mijoz ismi, mahsulot yoki sharh matni bo'yicha qidirish..."
                className="pl-9 rounded-xl text-xs"
              />
            </div>
          </div>

          {isLoadingReviews ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-muted-foreground">Sharhlar mavjud emas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => {
                const attachedPhotos = Array.isArray(r.images)
                  ? r.images
                  : typeof r.images === 'string'
                  ? JSON.parse(r.images || '[]')
                  : [];

                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4 shadow-xs">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-foreground">{r.user.name}</span>
                        <div className="flex items-center gap-0.5 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {r.rating} / 5
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-primary">
                        Mahsulot:{' '}
                        <Link to={`/product/${r.product.slug}`} className="hover:underline font-bold">
                          {r.product.nameUz}
                        </Link>
                      </div>

                      {r.comment && (
                        <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/50">
                          "{r.comment}"
                        </p>
                      )}

                      {/* Attached 3 Photos Gallery */}
                      {attachedPhotos.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                            Biriktirilgan rasmlar ({attachedPhotos.length} ta):
                          </p>
                          <div className="flex items-center gap-2">
                            {attachedPhotos.map((photoUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedPhoto(photoUrl)}
                                className="h-16 w-16 cursor-pointer rounded-xl overflow-hidden border border-primary/30 hover:scale-105 transition-all shadow-xs"
                              >
                                <img src={photoUrl} alt={`Attached ${idx + 1}`} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-end shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReview(r.id)}
                        className="text-destructive hover:bg-destructive/10 rounded-xl"
                        title="O'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadReviews(page - 1)} className="rounded-xl">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {page} / {pages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => loadReviews(page + 1)} className="rounded-xl">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
