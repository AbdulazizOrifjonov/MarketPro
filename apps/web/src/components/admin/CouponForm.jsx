import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function CouponForm({ coupon, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'PERCENT',
    value: coupon?.value ?? '',
    minOrder: coupon?.minOrder ?? '',
    usageLimit: coupon?.usageLimit ?? '',
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : undefined,
        expiresAt: form.expiresAt || undefined,
      };
      if (coupon) {
        await api.patch(`/coupons/${coupon.id}`, payload);
      } else {
        await api.post('/coupons', payload);
      }
      toast.success(t('common.save'));
      onSaved();
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Promo-kod" hint="masalan: SUMMER10 (mijoz kiritadigan kod)">
        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" required />
      </Field>

      <Field label="Chegirma turi">
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">Foiz (%) — masalan 10% chegirma</SelectItem>
            <SelectItem value="FIXED">Belgilangan summa — masalan 50 000 so'm</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label={form.type === 'PERCENT' ? 'Chegirma foizi' : "Chegirma summasi (so'm)"} hint={form.type === 'PERCENT' ? 'masalan: 10 (10% degani)' : "masalan: 50000"}>
        <Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'PERCENT' ? '10' : '50000'} required />
      </Field>

      <Field label="Minimal buyurtma summasi (so'm)" hint="ixtiyoriy — shu summadan kam buyurtmada kod ishlamaydi">
        <Input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="100000" />
      </Field>

      <Field label="Ishlatish limiti (marta)" hint="ixtiyoriy — bo'sh qoldirsangiz cheksiz">
        <Input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="1000" />
      </Field>

      <Field label="Amal qilish muddati" hint="ixtiyoriy — bo'sh qoldirsangiz muddatsiz">
        <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>{t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
    </form>
  );
}
