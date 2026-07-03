import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { translateFromUz } from '@/lib/translate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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

export function CategoryForm({ category, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [flat, setFlat] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [translatingName, setTranslatingName] = useState(false);

  const [form, setForm] = useState({
    nameUz: category?.nameUz || '',
    nameRu: category?.nameRu || '',
    nameEn: category?.nameEn || '',
    parentId: category?.parentId || '',
    imageUrl: category?.imageUrl || '',
  });

  useEffect(() => {
    api.get('/categories').then(({ data }) => setFlat(data.categories));
  }, []);

  function handleNameUzChange(value) {
    setForm((prev) => ({ ...prev, nameUz: value }));
    if (!value?.trim()) {
      setTranslatingName(false);
      setForm((prev) => ({ ...prev, nameRu: '', nameEn: '' }));
      return;
    }
    setTranslatingName(true);
    translateFromUz(value, (translations) => {
      setTranslatingName(false);
      setForm((prev) => ({
        ...prev,
        nameRu: translations.ru || prev.nameRu,
        nameEn: translations.en || prev.nameEn,
      }));
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (translatingName) {
      setError('Tarjima tugashini kuting...');
      return;
    }
    if (!form.nameRu?.trim() || !form.nameEn?.trim()) {
      setError("Nom uchun rus va ingliz tarjimalari kerak");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...form, parentId: form.parentId || undefined };
      if (category) {
        await api.patch(`/categories/${category.id}`, payload);
      } else {
        await api.post('/categories', payload);
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
      <Field
        label="Nomi (o'zbekcha)"
        hint={translatingName ? 'Tarjima qilinmoqda...' : "Rus va ingliz tiliga avtomatik tarjima qilinadi"}
      >
        <Input value={form.nameUz} onChange={(e) => handleNameUzChange(e.target.value)} placeholder="Elektronika" required />
      </Field>

      <Field label="Ota kategoriya" hint="agar bu sub-kategoriya bo'lsa tanlang, aks holda bo'sh qoldiring">
        <Select value={form.parentId || '__none__'} onValueChange={(v) => setForm({ ...form, parentId: v === '__none__' ? '' : v })}>
          <SelectTrigger>
            <SelectValue placeholder="Ota kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Asosiy kategoriya (ota yo'q) —</SelectItem>
            {flat.filter((c) => c.id !== category?.id).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nameUz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Rasm" hint="ixtiyoriy — fayl yuklang yoki havola qo'ying">
        <ImageUploader
          folder="categories"
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
