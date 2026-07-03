import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Loader2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setIsLoading(true);
    api
      .get(`/reviews/${slug}`)
      .then(({ data }) => setReviews(data.reviews))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [slug]);

  async function submitReview(e) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/reviews/${slug}`, { rating, comment });
      setRating(0);
      setComment('');
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
      {isAuthenticated && (
        <form onSubmit={submitReview} className="rounded-xl border border-border p-4">
          <h4 className="mb-2 text-sm font-semibold">{t('product.write_review')}</h4>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    'h-6 w-6',
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
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('product.write_review')}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" className="mt-3" disabled={submitting || rating === 0}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{review.user.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{review.user.name}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
