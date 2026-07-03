import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ size = 32, className }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/logo.png"
        alt="MarketPro"
        width={size}
        height={size}
        onError={() => setImgFailed(true)}
        className={cn('shrink-0 rounded-lg object-contain', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground', className)}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      M
    </span>
  );
}
