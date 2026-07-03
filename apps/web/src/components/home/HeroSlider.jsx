import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

const AUTOPLAY_MS = 5000;

export function HeroSlider() {
  const [sliders, setSliders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api
      .get('/sliders')
      .then(({ data }) => setSliders(data.sliders))
      .finally(() => setIsLoading(false));
  }, []);

  const goTo = useCallback(
    (next) => {
      setDirection(next > index || (index === sliders.length - 1 && next === 0) ? 1 : -1);
      setIndex(((next % sliders.length) + sliders.length) % sliders.length);
    },
    [index, sliders.length]
  );

  useEffect(() => {
    if (sliders.length <= 1) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % sliders.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [sliders.length]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      goTo(delta < 0 ? index + 1 : index - 1);
    }
    touchStartX.current = null;
  }

  if (isLoading) return <Skeleton className="aspect-[16/6] w-full rounded-2xl" />;
  if (sliders.length === 0) return null;

  const current = sliders[index];

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-md sm:aspect-[16/6]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Link to={current.link || '#'} className="block h-full w-full">
            <img src={current.imageUrl} alt={current.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-8 sm:left-8 sm:right-8">
              <h2 className="text-lg font-bold sm:text-3xl">{current.title}</h2>
              {current.subtitle && <p className="mt-1 text-xs opacity-90 sm:text-base">{current.subtitle}</p>}
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {sliders.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow sm:flex hover:bg-white"
            aria-label="previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow sm:flex hover:bg-white"
            aria-label="next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {sliders.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
