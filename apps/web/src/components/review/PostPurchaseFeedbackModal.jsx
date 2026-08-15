import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Upload, X, ImageIcon, CheckCircle2, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export function PostPurchaseFeedbackModal() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [pendingItems, setPendingItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowBanner(false);
      return;
    }

    // Always check for pending delivered feedback on login / page refresh
    api
      .get('/reviews/pending-feedback')
      .then(({ data }) => {
        if (data.pendingItems && data.pendingItems.length > 0) {
          setPendingItems(data.pendingItems);
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      })
      .catch(() => {});
  }, [user]);

  if (!showBanner || pendingItems.length === 0) return null;

  const currentItem = pendingItems[currentIndex];

  function handleOpenModal(e) {
    if (e) e.stopPropagation();
    setShowFullModal(true);
  }

  function handleNavigateToProduct(e) {
    if (e) e.stopPropagation();
    navigate(`/product/${currentItem.productSlug}#reviews`);
    setShowFullModal(true);
  }

  function handleAddImageUrl() {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 3) {
      toast.error('Maksimal 3 ta rasm biriktirish mumkin!');
      return;
    }
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    setShowUrlInput(false);
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 3) {
      toast.error('Maksimal 3 ta rasm biriktirish mumkin!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImages((prev) => [...prev, event.target.result]);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating || rating < 1) {
      toast.error('Iltimos, yulduzcha yordamida baho bering!');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reviews/${currentItem.productSlug}`, {
        rating,
        comment,
        images,
      });

      toast.success('Sharhingiz va bahoyingiz muvaffaqiyatli saqlandi! Rahmat!');

      if (currentIndex + 1 < pendingItems.length) {
        setCurrentIndex((prev) => prev + 1);
        setRating(5);
        setComment('');
        setImages([]);
      } else {
        setShowFullModal(false);
        setShowBanner(false);
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* ── 90% Width Dynamic Floating Banner (above bottom nav) ──────────────── */}
      {!showFullModal && (
        <div
          onClick={handleOpenModal}
          className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl h-[100px] sm:h-[130px] md:h-[150px] rounded-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-xl shadow-2xl p-2.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary hover:shadow-primary/20 transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          {/* Left Product Image */}
          <div className="relative shrink-0">
            <img
              src={currentItem.productImage}
              alt={currentItem.productName}
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl object-cover border border-border shadow-sm"
            />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
              ✓
            </span>
          </div>

          {/* Center Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Yetkazildi — Baho bering!</span>
            </div>
            <h4 className="font-heading font-extrabold text-xs sm:text-sm md:text-base text-foreground truncate mt-0.5">
              {currentItem.productName}
            </h4>
            <div className="flex items-center gap-1 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
              ))}
              <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                (Buyurtma #{currentItem.orderNumber})
              </span>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex flex-col gap-1 items-end">
            <Button
              size="sm"
              onClick={handleOpenModal}
              className="gap-1 rounded-xl font-bold bg-primary hover:bg-primary/90 text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <span>Baho berish</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBanner(false);
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline px-1 mt-1"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* ── Full Detailed Review Modal ───────────────────────────────────────── */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-primary/30 bg-card p-5 sm:p-7 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowFullModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
              title="Yopish"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Yetkazilgan mahsulot uchun baho
            </div>

            <h2 className="mt-3 font-heading text-xl sm:text-2xl font-extrabold text-foreground">
              Xaridingiz haqida fikr bildiring!
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Buyurtma: <span className="font-semibold text-primary">#{currentItem.orderNumber}</span>
            </p>

            {/* Product Preview Card */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
              <img
                src={currentItem.productImage}
                alt={currentItem.productName}
                className="h-16 w-16 rounded-xl object-cover border border-border"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-foreground truncate">
                  {currentItem.productName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Mahsulotga 1-5 ⭐ baho bering va 3 tagacha rasm biriktiring
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  ⭐ Bahoingizni belgilang (1 dan 5 gacha):
                </label>
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/20 py-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-xs font-bold text-amber-500 mt-1">
                  {rating === 5 && "🌟 A'lo darajada / 5"}
                  {rating === 4 && "👍 Juda yaxshi / 4"}
                  {rating === 3 && "😐 Qoniqarli / 3"}
                  {rating === 2 && "👎 Yomon / 2"}
                  {rating === 1 && "⚠️ Juda yomon / 1"}
                </p>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  💬 Izohingiz (Qulayliklar, sifat, tezlik):
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Mahsulot haqida fikringiz va tavsiyangizni yozing..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Up to 3 Image Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    📷 Mahsulot rasmlari (Maksimal 3 ta):
                  </label>
                  <span className="text-[11px] font-semibold text-primary">
                    {images.length} / 3 rasm
                  </span>
                </div>

                {/* Attached Thumbnails */}
                <div className="grid grid-cols-3 gap-2">
                  {images.map((imgUrl, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-primary/30">
                      <img src={imgUrl} alt={`Attached ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-white opacity-90 group-hover:opacity-100 transition-opacity"
                        title="O'chirish"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button Slot if < 3 */}
                  {images.length < 3 && (
                    <div className="relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-center p-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="h-5 w-5 text-primary mb-1" />
                      <span className="text-[10px] font-bold text-primary">Rasm yuklash</span>
                    </div>
                  )}
                </div>

                {/* Preset Option / URL Input Option */}
                {images.length < 3 && (
                  <div className="mt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Rasm havolasi (URL) kiritish
                    </button>

                    {showUrlInput && (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 rounded-lg border border-input p-2 text-xs"
                        />
                        <Button type="button" size="sm" onClick={handleAddImageUrl}>
                          Qo'shish
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFullModal(false)}
                  className="flex-1 rounded-xl"
                >
                  Keyinroq
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : '⭐ Bahoni yuborish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
