import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function ProductReviews({ slug }) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  function load() {
    setIsLoading(true);
    api
      .get(`/reviews/${slug}`)
      .then(({ data }) => setReviews(data.reviews))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [slug]);

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 3) {
      toast.error('Maksimal 3 ta rasm yuklash mumkin!');
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

  function handleRemoveImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submitReview(e) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/reviews/${slug}`, { rating, comment, images });
      setRating(0);
      setComment('');
      setImages([]);
      toast.success(t('product.write_review'));
      load();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={selectedPhoto} alt="Review Photo" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 rounded-full bg-white p-2 text-black shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <form onSubmit={submitReview} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-foreground">{t('product.write_review')}</h4>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    (hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Mahsulot haqida sharh qoldiring..."
          />

          {/* Up to 3 Image attachments */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              📷 Rasmlar (Maksimal 3 ta):
            </label>
            <div className="flex items-center gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-primary/30 group">
                  <img src={img} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 rounded-full bg-destructive text-white p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {images.length < 3 && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold text-primary mt-1">Rasm</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" size="sm" className="font-bold bg-primary hover:bg-primary/90" disabled={submitting || rating === 0}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {t('common.save')}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const reviewImages = Array.isArray(review.images)
              ? review.images
              : typeof review.images === 'string'
              ? JSON.parse(review.images || '[]')
              : [];

            return (
              <div key={review.id} className="flex gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {review.user.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{review.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Up to 3 Attached Photos Gallery */}
                  {reviewImages.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      {reviewImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(imgUrl)}
                          className="h-16 w-16 cursor-pointer rounded-xl overflow-hidden border border-border hover:border-primary transition-all hover:scale-105 shadow-xs"
                        >
                          <img src={imgUrl} alt={`Review photo ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
