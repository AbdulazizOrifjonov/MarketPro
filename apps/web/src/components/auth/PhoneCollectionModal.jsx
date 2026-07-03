import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PhoneCollectionModal({ open, onComplete }) {
  const [phone, setPhone] = useState('+998');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const cleaned = phone.replace(/\s+/g, '');
    if (!/^\+998\d{9}$/.test(cleaned)) {
      toast.error('Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me', { phone: cleaned });
      toast.success('Telefon raqam saqlandi');
      onComplete();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm rounded-xl border border-border/50 bg-card/95 p-6 shadow-2xl backdrop-blur-xl mx-4"
          >
            <button
              onClick={onComplete}
              className="absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-1 text-lg font-bold">Telefon raqamingiz</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Siz bilan bog'lanish uchun telefon raqamingizni kiriting
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val.startsWith('+998')) setPhone('+998');
                  else if (val.length <= 13) setPhone(val);
                }}
                placeholder="+998901234567"
                className="text-base tracking-wider"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Saqlash
              </Button>
              <button
                type="button"
                onClick={onComplete}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Keyinroq
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
