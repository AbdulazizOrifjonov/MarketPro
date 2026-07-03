import { useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/product/ImageLightbox';

export function ProductGallery({ images, videoUrl, name }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imgRef = useRef(null);

  const media = [...(images || []), ...(videoUrl ? [{ id: 'video', url: videoUrl, isVideo: true }] : [])];
  const active = media[activeIndex] || {};
  const imageUrls = (images || []).map((m) => m.url);

  function handleMouseMove(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:w-20 sm:flex-col sm:overflow-y-auto">
        {media.map((m, i) => (
          <button
            key={m.id || i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 sm:w-full',
              activeIndex === i ? 'border-primary' : 'border-transparent'
            )}
          >
            {m.isVideo ? (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs">▶</div>
            ) : (
              <img src={m.url} alt="" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>

      <div
        ref={imgRef}
        className="group relative order-1 aspect-square w-full flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-muted sm:order-2"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => !active.isVideo && setLightboxOpen(true)}
      >
        {active.isVideo ? (
          <video src={active.url} controls className="h-full w-full object-contain" />
        ) : (
          <>
            <img
              src={active.url}
              alt={name}
              className={cn('h-full w-full object-cover transition-transform duration-200', isZooming && 'scale-150')}
              style={isZooming ? zoomStyle : undefined}
            />
            <div className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-80">
              <ZoomIn className="h-4 w-4" />
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={imageUrls}
          index={Math.min(activeIndex, imageUrls.length - 1)}
          onIndexChange={setActiveIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
