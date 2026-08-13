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
            <Clock className="h-3.5 w-3.5" /> Dush–Yak: 09:00–21:00
          </span>
          <a href="tel:+998712000000" className="flex items-center gap-1.5 hover:text-white/80">
            <Phone className="h-3.5 w-3.5" /> +998 71 200 00 00
          </a>
        </div>
      </div>
    </div>
  );
}
