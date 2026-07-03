import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { translateFromUz, generateSku, calcDisplayPrice, previewDisplayPrice } from '@/lib/translate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { VideoUploader } from '@/components/admin/VideoUploader';
import { formatUZS } from '@/lib/utils';

function flattenCategories(list, depth = 0) {
  return list.flatMap((c) => [{ ...c, depth }, ...flattenCategories(c.children || [], depth + 1)]);
}

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

export function ProductForm({ product, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [translatingName, setTranslatingName] = useState(false);
  const [translatingDescription, setTranslatingDescription] = useState(false);

  const initialSalePrice = product ? (product.discountPrice ?? product.price) : '';

  const [form, setForm] = useState({
    nameUz: product?.nameUz || '',
    nameRu: product?.nameRu || '',
    nameEn: product?.nameEn || '',
    descriptionUz: product?.descriptionUz || '',
    descriptionRu: product?.descriptionRu || '',
    descriptionEn: product?.descriptionEn || '',
    salePrice: initialSalePrice || '',
    stock: product?.stock ?? '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    videoUrl: product?.videoUrl || '',
    isFeatured: product?.isFeatured || false,
    images: product?.images?.map((i) => i.url) || [],
  });
  const [specs, setSpecs] = useState(
    product?.specs ? Object.entries(JSON.parse(product.specs)) : [['', '']]
  );

  const pricePreview = previewDisplayPrice(form.salePrice);

  useEffect(() => {
    api.get('/categories/tree').then(({ data }) => setCategories(flattenCategories(data.categories)));
    api.get('/brands').then(({ data }) => setBrands(data.brands));
  }, []);

  useEffect(() => {
    if (!product && !form.sku) {
      setForm((prev) => ({ ...prev, sku: generateSku() }));
    }
  }, [product, form.sku]);

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

  function handleDescriptionUzChange(value) {
    setForm((prev) => ({ ...prev, descriptionUz: value }));
    if (!value?.trim()) {
      setTranslatingDescription(false);
      setForm((prev) => ({ ...prev, descriptionRu: '', descriptionEn: '' }));
      return;
    }
    setTranslatingDescription(true);
    translateFromUz(value, (translations) => {
      setTranslatingDescription(false);
      setForm((prev) => ({
        ...prev,
        descriptionRu: translations.ru || prev.descriptionRu,
        descriptionEn: translations.en || prev.descriptionEn,
      }));
    });
  }

  function updateSpec(index, key, value) {
    setSpecs((prev) => prev.map((s, i) => (i === index ? [key, value] : s)));
  }
  function addSpec() {
    setSpecs((prev) => [...prev, ['', '']]);
  }
  function removeSpec(index) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (translatingName || translatingDescription) {
      setError('Tarjima tugashini kuting...');
      return;
    }
    if (!form.nameRu?.trim() || !form.nameEn?.trim()) {
      setError("Nom uchun rus va ingliz tarjimalari kerak");
      return;
    }
    if (!form.descriptionRu?.trim() || !form.descriptionEn?.trim()) {
      setError("Tavsif uchun rus va ingliz tarjimalari kerak");
      return;
    }
    if (form.images.length < 3) {
      setError('Kamida 3 ta rasm kerak');
      return;
    }
    const salePrice = parseFloat(form.salePrice);
    if (!salePrice || salePrice <= 0) {
      setError("Sotuv narxi to'g'ri kiriting");
      return;
    }
    setIsSubmitting(true);
    try {
      const { original } = calcDisplayPrice(salePrice);
      const payload = {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        nameEn: form.nameEn,
        descriptionUz: form.descriptionUz,
        descriptionRu: form.descriptionRu,
        descriptionEn: form.descriptionEn,
        price: original,
        discountPrice: salePrice,
        stock: parseInt(form.stock, 10) || 0,
        sku: form.sku,
        brandId: form.brandId || null,
        categoryId: form.categoryId,
        videoUrl: form.videoUrl,
        isFeatured: true,
        images: form.images,
        specs: Object.fromEntries(specs.filter(([k]) => k.trim())),
      };
      if (product) {
        await api.patch(`/products/${product.id}`, payload);
      } else {
        await api.post('/products', payload);
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
        <Input value={form.nameUz} onChange={(e) => handleNameUzChange(e.target.value)} placeholder="Samsung Galaxy S24" required />
      </Field>

      <Field
        label="Tavsif (o'zbekcha)"
        hint={translatingDescription ? 'Tarjima qilinmoqda...' : "Rus va ingliz tiliga avtomatik tarjima qilinadi"}
      >
        <textarea
          value={form.descriptionUz}
          onChange={(e) => handleDescriptionUzChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder="Yuqori sifatli mahsulot..."
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Sotuv narxi (so'm)" hint="mijoz to'laydigan narx">
          <Input type="number" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="1200000" required />
        </Field>
        <Field label="Zaxiradagi soni (dona)" hint="masalan: 25">
          <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="25" required />
        </Field>
        <Field label="SKU (mahsulot kodi)" hint="avtomatik yaratiladi">
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="MP-1001" required />
        </Field>
      </div>

      {pricePreview && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium text-primary">Narx ko'rinishi (avtomatik hisoblanadi)</p>
          <p className="mt-1 text-muted-foreground">
            Ko'rsatiladigan asl narx: {formatUZS(pricePreview.minOriginal)} – {formatUZS(pricePreview.maxOriginal)}
            {' · '}
            Chegirma: {pricePreview.minDiscount}% – {pricePreview.maxDiscount}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Kategoriya">
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Kategoriyani tanlang" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{'—'.repeat(c.depth)} {c.nameUz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Brend" hint="ixtiyoriy">
          <Select value={form.brandId || '__none__'} onValueChange={(v) => setForm({ ...form, brandId: v === '__none__' ? '' : v })}>
            <SelectTrigger>
              <SelectValue placeholder="Brendni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Brendsiz —</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Video" hint="ixtiyoriy — fayl yuklang yoki havola qo'ying">
        <VideoUploader folder="products" value={form.videoUrl} onChange={(videoUrl) => setForm({ ...form, videoUrl })} />
      </Field>

      <Field label="Rasmlar" hint="kamida 3 ta — fayl yuklang yoki havola qo'ying">
        <ImageUploader folder="products" images={form.images} onChange={(images) => setForm({ ...form, images })} min={3} />
      </Field>

      <Field label={t('product.specifications')} hint="masalan: Brend → Samsung, Rangi → Qora">
        <div className="space-y-2">
          {specs.map(([key, value], i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Xususiyat nomi (masalan: Rangi)" value={key} onChange={(e) => updateSpec(i, e.target.value, value)} />
              <Input placeholder="Qiymati (masalan: Qora)" value={value} onChange={(e) => updateSpec(i, key, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="h-4 w-4" /> Xususiyat qo'shish
          </Button>
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
        <span>
          Tavsiya etilgan mahsulot sifatida ko'rsatish (bosh sahifada chiqadi)
          <span className="ml-1 text-destructive">*</span>
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isSubmitting}>{t('common.save')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
    </form>
  );
}
