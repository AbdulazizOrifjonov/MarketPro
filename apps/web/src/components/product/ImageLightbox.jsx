import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImageLightbox({ images, index, onIndexChange, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onIndexChange, onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex flex-1 items-center justify-center px-4 sm:px-16">
          {images.length > 1 && (
            <button
              onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
              aria-label="previous"
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={index}
              src={images[index]}
              alt=""
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="max-h-[80svh] max-w-full select-none rounded-lg object-contain"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <button
              onClick={() => onIndexChange((index + 1) % images.length)}
              aria-label="next"
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto p-4">
            {images.map((url, i) => (
              <button
                key={url + i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity',
                  i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                )}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
