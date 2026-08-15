import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Upload, X, ImageIcon, CheckCircle2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { localizedField } from '@/lib/localize';
import { useTranslation } from 'react-i18next';

export default function ProductReviewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const orderNumber = searchParams.get('orderNumber') || '';
  const orderId = searchParams.get('orderId') || '';

  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingProduct(true);
    api
      .get(`/products/${slug}`)
      .then(({ data }) => setProduct(data.product))
      .catch((err) => {
        toast.error(err.friendlyMessage || 'Mahsulot topilmadi');
        navigate('/');
      })
      .finally(() => setIsLoadingProduct(false));
  }, [slug, navigate]);

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
      await api.post(`/reviews/${slug}`, {
        rating,
        comment,
        images,
      });

      toast.success('Sharhingiz va bahoyingiz muvaffaqiyatli saqlandi! Rahmat!');
      navigate(`/product/${slug}#reviews`);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingProduct) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return null;

  const productName = localizedField(product, 'name', i18n.language) || product.nameUz;
  const productImage = product.images?.[0]?.url || '/placeholder.png';

  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10 px-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Orqaga qaytish</span>
      </button>

      {/* Main Glass Card */}
      <div className="rounded-3xl border border-primary/20 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span>Yetkazilgan mahsulot uchun baho</span>
        </div>

        <h1 className="mt-4 font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
          Xaridingiz haqida fikr bildiring!
        </h1>
        {orderNumber && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Buyurtma: <span className="font-bold text-primary">#{orderNumber}</span>
          </p>
        )}

        {/* Product Preview Box */}
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4">
          <img
            src={productImage}
            alt={productName}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-border shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-bold text-green-600 dark:text-green-400 mb-1">
              Yetkazildi ✅
            </span>
            <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2">
              {productName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Mahsulotga 1-5 ⭐ baho bering va 3 tagacha rasm biriktiring
            </p>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              ⭐ Bahoingizni belgilang (1 dan 5 gacha):
            </label>
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-muted/20 py-4">
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
                      className={`h-9 w-9 sm:h-10 sm:w-10 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-sm font-extrabold text-amber-500 mt-2">
              {rating === 5 && "🌟 A'lo darajada / 5"}
              {rating === 4 && "👍 Juda yaxshi / 4"}
              {rating === 3 && "😐 Qoniqarli / 3"}
              {rating === 2 && "👎 Yomon / 2"}
              {rating === 1 && "⚠️ Juda yomon / 1"}
            </p>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">
              💬 Izohingiz (Sifat, qulaylik, tezlik haqida):
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Mahsulot haqida fikringiz va tavsiyangizni batafsil yozing..."
              className="w-full rounded-2xl border border-input bg-background p-3.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Up to 3 Image Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-foreground">
                📷 Mahsulot rasmlari (Maksimal 3 ta):
              </label>
              <span className="text-xs font-bold text-primary">
                {images.length} / 3 rasm
              </span>
            </div>

            {/* Attached Thumbnails */}
            <div className="grid grid-cols-3 gap-3">
              {images.map((imgUrl, i) => (
                <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-primary/40 shadow-sm">
                  <img src={imgUrl} alt={`Attached ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-destructive/90 p-1 text-white opacity-90 group-hover:opacity-100 transition-opacity shadow"
                    title="O'chirish"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Upload Button Slot if < 3 */}
              {images.length < 3 && (
                <div className="relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-center p-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-6 w-6 text-primary mb-1" />
                  <span className="text-xs font-bold text-primary">Rasm yuklash</span>
                </div>
              )}
            </div>

            {/* URL Input Option */}
            {images.length < 3 && (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <ImageIcon className="h-4 w-4" />
                  Rasm havolasi (URL) kiritish
                </button>

                {showUrlInput && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 rounded-xl border border-input p-2.5 text-xs"
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
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl h-12 text-sm font-semibold"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 text-sm font-extrabold text-white shadow-lg"
            >
              {isSubmitting ? 'Saqlanmoqda...' : '⭐ Bahoni yuborish'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
