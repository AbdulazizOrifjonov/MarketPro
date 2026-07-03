import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';

function useCountdown(target) {
  const [remaining, setRemaining] = useState(() => target - Date.now());
  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  const clamped = Math.max(0, remaining);
  const hours = String(Math.floor(clamped / 3_600_000)).padStart(2, '0');
  const minutes = String(Math.floor((clamped % 3_600_000) / 60_000)).padStart(2, '0');
  const seconds = String(Math.floor((clamped % 60_000) / 1000)).padStart(2, '0');
  return { hours, minutes, seconds, expired: clamped <= 0 };
}

export function FlashSale() {
  const { t } = useTranslation();
  const [sale, setSale] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    let canceled = false;
    function fetchSale() {
      api.get('/flash-sale/active').then(({ data }) => {
        if (!canceled) setSale(data.flashSale);
      }).finally(() => { if (!canceled) setIsLoading(false); });
    }
    fetchSale();
    const interval = setInterval(fetchSale, 30000);
    return () => { canceled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (sale && !hasAutoOpened) {
      const dismissed = sessionStorage.getItem(`flash_sale_dismissed_${sale.id}`);
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasAutoOpened(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [sale, hasAutoOpened]);

  const countdown = useCountdown(sale ? new Date(sale.endsAt).getTime() : 0);

  if (isLoading || !sale || sale.items.length === 0 || countdown.expired) return null;

  const products = sale.items.map((item) => item.product);

  function handleClose() {
    setIsOpen(false);
    sessionStorage.setItem(`flash_sale_dismissed_${sale.id}`, 'true');
  }

  return (
    <>
      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95"
      >
        <Zap className="h-4 w-4 fill-current" />
        <span>{countdown.hours}:{countdown.minutes}:{countdown.seconds}</span>
        <ChevronUp className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 top-[var(--header-height,64px)] z-50 flex flex-col bg-background"
          >
            <div className="sticky top-0 z-10 border-b border-border bg-primary text-primary-foreground">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 fill-current" />
                  <div>
                    <h2 className="text-lg font-bold sm:text-xl">{t('home.flash_sale')}</h2>
                    <p className="text-xs text-primary-foreground/70">{t('home.flash_sale_ends')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-mono text-base font-bold sm:text-lg">
                    <span className="rounded-lg bg-background/20 px-2.5 py-1">{countdown.hours}</span>
                    <span className="animate-pulse">:</span>
                    <span className="rounded-lg bg-background/20 px-2.5 py-1">{countdown.minutes}</span>
                    <span className="animate-pulse">:</span>
                    <span className="rounded-lg bg-background/20 px-2.5 py-1">{countdown.seconds}</span>
                  </div>
                  <button onClick={handleClose} className="rounded-lg bg-background/20 p-2 transition-colors hover:bg-background/30">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
