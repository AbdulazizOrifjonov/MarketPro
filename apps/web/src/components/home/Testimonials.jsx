import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function Testimonials() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api
      .get('/reviews/featured')
      .then(({ data }) => setReviews(data.reviews))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 6000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[index];

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold sm:text-xl">{t('home.customer_reviews')}</h2>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Quote className="absolute right-6 top-6 h-10 w-10 text-primary/10" />
        <AnimatePresence mode="wait">
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={review.user.avatarUrl} alt={review.user.name} />
                <AvatarFallback>{review.user.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{review.user.name}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/85 sm:text-base">{review.comment}</p>
            {review.product && (
              <Link to={`/product/${review.product.slug}`} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                {review.product.nameUz}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {reviews.length > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`go to review ${i + 1}`}
                  className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIndex((index - 1 + reviews.length) % reviews.length)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-accent"
                aria-label="previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIndex((index + 1) % reviews.length)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-accent"
                aria-label="next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
