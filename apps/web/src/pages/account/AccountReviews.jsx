import { useEffect, useState } from 'react';
import { Star, Upload, X, ImageIcon, CheckCircle2, MessageSquare, Loader2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountReviews() {
  const [pendingItems, setPendingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingSlug, setSubmittingSlug] = useState(null);

  // Per-item review form states
  const [formStates, setFormStates] = useState({});

  useEffect(() => {
    fetchPending();
  }, []);

  function fetchPending() {
    setIsLoading(true);
    api
      .get('/reviews/pending-feedback')
      .then(({ data }) => {
        const items = data.pendingItems || [];
        setPendingItems(items);

        // Initialize form state for each pending item
        const initialStates = {};
        items.forEach((item) => {
          initialStates[item.productSlug] = {
            rating: 5,
            hoverRating: 0,
            comment: '',
            images: [],
            imageUrlInput: '',
            showUrlInput: false,
          };
        });
        setFormStates(initialStates);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  function updateItemState(slug, updates) {
    setFormStates((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], ...updates },
    }));
  }

  function handleFileUpload(slug, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const itemState = formStates[slug] || { images: [] };

    if (itemState.images.length >= 3) {
      toast.error('Maksimal 3 ta rasm biriktirish mumkin!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateItemState(slug, {
          images: [...itemState.images, event.target.result],
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddImageUrl(slug) {
    const itemState = formStates[slug];
    if (!itemState?.imageUrlInput?.trim()) return;
    if (itemState.images.length >= 3) {
      toast.error('Maksimal 3 ta rasm biriktirish mumkin!');
      return;
    }

    updateItemState(slug, {
      images: [...itemState.images, itemState.imageUrlInput.trim()],
      imageUrlInput: '',
      showUrlInput: false,
    });
  }

  function handleRemoveImage(slug, index) {
    const itemState = formStates[slug];
    if (!itemState) return;
    updateItemState(slug, {
      images: itemState.images.filter((_, i) => i !== index),
    });
  }

  async function handleSubmitReview(item, e) {
    e.preventDefault();
    const itemState = formStates[item.productSlug];
    if (!itemState || !itemState.rating || itemState.rating < 1) {
      toast.error('Iltimos, yulduzcha yordamida baho bering!');
      return;
    }

    setSubmittingSlug(item.productSlug);
    try {
      await api.post(`/reviews/${item.productSlug}`, {
        rating: itemState.rating,
        comment: itemState.comment,
        images: itemState.images,
      });

      toast.success(`${item.productName} uchun bahoyingiz saqlandi! Rahmat!`);

      // Remove from pending list
      setPendingItems((prev) => prev.filter((i) => i.productSlug !== item.productSlug));
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    } finally {
      setSubmittingSlug(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading">
          ⭐ Mahsulotlarni baholash va sharhlar
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Qo'lingizga yetib borgan mahsulotlarga baho berishingiz va rasm biriktirishingiz mumkin.
        </p>
      </div>

      {/* Pending Items List (Birin-ketin) */}
      {pendingItems.length > 0 ? (
        <div className="space-y-6">
          {pendingItems.map((item) => {
            const state = formStates[item.productSlug] || {
              rating: 5,
              hoverRating: 0,
              comment: '',
              images: [],
              imageUrlInput: '',
              showUrlInput: false,
            };
            const isSubmitting = submittingSlug === item.productSlug;

            return (
              <div
                key={item.productId}
                className="rounded-3xl border border-primary/20 bg-card p-5 sm:p-6 shadow-md backdrop-blur-sm transition-all hover:border-primary/40"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="gap-1 rounded-full px-3 py-1 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Yetkazildi
                    </Badge>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Buyurtma #{item.orderNumber}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    ⭐ Baho berish kutilmoqda
                  </span>
                </div>

                {/* Product Detail Banner */}
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-3.5">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-border shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mahsulot sifatiga 1-5 ⭐ baho va 3 tagacha rasm biriktiring
                    </p>
                  </div>
                </div>

                {/* Review Form */}
                <form onSubmit={(e) => handleSubmitReview(item, e)} className="mt-5 space-y-4">
                  {/* Star Picker */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-2">
                      ⭐ Bahoingizni belgilang (1 dan 5 gacha):
                    </label>
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/20 py-3">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (state.hoverRating || state.rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateItemState(item.productSlug, { rating: star })}
                            onMouseEnter={() => updateItemState(item.productSlug, { hoverRating: star })}
                            onMouseLeave={() => updateItemState(item.productSlug, { hoverRating: 0 })}
                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-center text-xs font-bold text-amber-500 mt-1">
                      {state.rating === 5 && "🌟 A'lo darajada / 5"}
                      {state.rating === 4 && "👍 Juda yaxshi / 4"}
                      {state.rating === 3 && "😐 Qoniqarli / 3"}
                      {state.rating === 2 && "👎 Yomon / 2"}
                      {state.rating === 1 && "⚠️ Juda yomon / 1"}
                    </p>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      💬 Izohingiz (Qulayliklar, sifat, yetkazib berish):
                    </label>
                    <textarea
                      rows={3}
                      value={state.comment}
                      onChange={(e) => updateItemState(item.productSlug, { comment: e.target.value })}
                      placeholder="Mahsulot haqida fikringiz va tavsiyangizni yozing..."
                      className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Up to 3 Images */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-foreground">
                        📷 Mahsulot rasmlari (Maksimal 3 ta):
                      </label>
                      <span className="text-[11px] font-bold text-primary">
                        {state.images.length} / 3 rasm
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {state.images.map((imgUrl, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-primary/30">
                          <img src={imgUrl} alt={`Attached ${i + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(item.productSlug, i)}
                            className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-white opacity-90 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {state.images.length < 3 && (
                        <div className="relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-center p-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(item.productSlug, e)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="h-5 w-5 text-primary mb-1" />
                          <span className="text-[10px] font-bold text-primary">Rasm yuklash</span>
                        </div>
                      )}
                    </div>

                    {state.images.length < 3 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => updateItemState(item.productSlug, { showUrlInput: !state.showUrlInput })}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Rasm havolasi (URL) kiritish
                        </button>

                        {state.showUrlInput && (
                          <div className="flex gap-2 mt-1.5">
                            <input
                              type="url"
                              value={state.imageUrlInput}
                              onChange={(e) => updateItemState(item.productSlug, { imageUrlInput: e.target.value })}
                              placeholder="https://example.com/photo.jpg"
                              className="flex-1 rounded-lg border border-input p-2 text-xs"
                            />
                            <Button type="button" size="sm" onClick={() => handleAddImageUrl(item.productSlug)}>
                              Qo'shish
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-primary hover:bg-primary/90 font-bold py-2.5 shadow-md"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Saqlanmoqda...
                        </span>
                      ) : (
                        '⭐ Bahoni yuborish'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
          <PackageCheck className="h-12 w-12 text-primary/60 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Barcha baholar berilgan!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Hozircha baholanmagan yetkazilgan buyurtmalaringiz yo'q. Yangi xaridlaringiz yetkazib berilgach shu yerda paydo bo'ladi.
          </p>
        </div>
      )}
    </div>
  );
}
