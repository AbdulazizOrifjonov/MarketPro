import { motion } from 'framer-motion';
import { Sparkles, Heart, Truck, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { icon: Sparkles, title: 'Original mahsulotlar', desc: 'Faqat sertifikatlangan brendlar' },
  { icon: Heart, title: 'G\'amxo\'rlik bilan', desc: 'Har bir buyurtma ehtiyotkorlik bilan tayyorlanadi' },
  { icon: Truck, title: 'Tezkor yetkazib berish', desc: 'O\'zbekiston bo\'ylab tez va ishonchli' },
  { icon: ShieldCheck, title: 'Xavfsiz to\'lov', desc: 'To\'lovingiz har doim himoyalangan' },
];

export function TrustBadges() {
  return (
    <section className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, desc }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}
