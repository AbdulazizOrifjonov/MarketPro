import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/admin/ImageUploader';

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

export function SliderForm({ slider, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: slider?.title || '',
    subtitle: slider?.subtitle || '',
    link: slider?.link || '',
    imageUrl: slider?.imageUrl || '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.imageUrl) {
      setError('Rasm yuklash yoki havola qo\'yish shart');
      return;
    }
    setIsSubmitting(true);
    try {
      if (slider) {
        await api.patch(`/sliders/${slider.id}`, form);
      } else {
        await api.post('/sliders', form);
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
      <Field label="Sarlavha" hint="masalan: Yozgi chegirmalar">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Yozgi chegirmalar" required />
      </Field>
      <Field label="Subtitr" hint="ixtiyoriy, masalan: 70% gacha chegirma">
        <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="70% gacha chegirma" />
      </Field>
      <Field label="Havola" hint="bosilganda qayerga o'tadi, masalan: /catalog?onSale=true">
        <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/catalog?onSale=true" />
      </Field>

      <Field label="Rasm" hint="kerakli o'lcham: 1600x600 — fayl yuklang yoki havola qo'ying">
        <ImageUploader
          folder="sliders"
          images={form.imageUrl ? [form.imageUrl] : []}
          onChange={(images) => setForm({ ...form, imageUrl: images[images.length - 1] || '' })}
        />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>{t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
    </form>
  );
}
