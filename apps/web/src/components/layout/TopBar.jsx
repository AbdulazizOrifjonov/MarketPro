import { Phone, Clock, Truck } from 'lucide-react';

export function TopBar() {
  return (
    <div className="hidden h-9 border-b border-primary/20 bg-primary text-xs text-primary-foreground lg:block">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          <span>Yetkazib berish: butun O'zbekiston bo'ylab</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Dush–Shanba: 09:00–19:00
          </span>
          <a href="tel:+998902155216" className="flex items-center gap-1.5 hover:text-white/80">
            <Phone className="h-3.5 w-3.5" /> +998 90 215 52 16
          </a>
        </div>
      </div>
    </div>
  );
}
