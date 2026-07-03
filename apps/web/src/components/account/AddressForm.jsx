import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { YandexMapPicker } from '@/components/account/YandexMapPicker';
import { UZ_REGIONS, getDistricts, matchRegion, matchDistrict } from '@/lib/uzRegions';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

export function AddressForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    region: initial?.region || '',
    district: initial?.district || '',
    neighborhood: initial?.neighborhood || '',
    street: initial?.street || '',
    houseNumber: initial?.houseNumber || '',
    lat: initial?.lat ?? null,
    lng: initial?.lng ?? null,
  });

  const districts = useMemo(() => getDistricts(form.region), [form.region]);
  const isValid = form.region && form.district && form.street;

  function handleRegionChange(region) {
    setForm((prev) => ({ ...prev, region, district: '' }));
  }

  function handleMapPick(lat, lng) {
    setForm((prev) => ({ ...prev, lat, lng }));
  }

  function handleAddressDetected({ region, district, street }) {
    setForm((prev) => {
      const matchedRegion = matchRegion(region);
      const matchedDistrict = matchedRegion ? matchDistrict(matchedRegion.name, district) : null;
      return {
        ...prev,
        region: matchedRegion ? matchedRegion.name : prev.region,
        district: matchedDistrict || prev.district,
        street: street || prev.street,
      };
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Viloyat">
          <Select value={form.region} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Viloyatni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {UZ_REGIONS.map((r) => (
                <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tuman">
          <Select value={form.district} onValueChange={(district) => setForm({ ...form, district })} disabled={!form.region}>
            <SelectTrigger>
              <SelectValue placeholder={form.region ? 'Tumanni tanlang' : 'Avval viloyatni tanlang'} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Mahalla / Qishloq">
          <Input
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            placeholder="masalan: Yangiobod MFY"
          />
        </Field>
        <Field label="Ko'cha">
          <Input
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            placeholder="masalan: Amir Temur ko'chasi"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Uy raqami">
          <Input
            value={form.houseNumber}
            onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
            placeholder="masalan: 12"
          />
        </Field>
      </div>

      <Field label="Xaritadan joyni belgilang (ixtiyoriy)">
        <YandexMapPicker lat={form.lat} lng={form.lng} onChange={handleMapPick} onAddressDetected={handleAddressDetected} />
      </Field>

      <div className="flex gap-2 pt-1">
        <Button size="sm" disabled={!isValid || saving} onClick={() => onSave(form)}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
        )}
      </div>
    </div>
  );
}
