import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AdminModal from '@/components/admin/AdminModal';

export default function AdminBrands() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const initialValues = useRef({ name: '', logoUrl: '' });
  const modalRef = useRef(null);

  function load() {
    setIsLoading(true);
    api.get('/brands').then(({ data }) => setBrands(data.brands)).finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditBrand(null);
    setName('');
    setLogoUrl('');
    initialValues.current = { name: '', logoUrl: '' };
    setShowModal(true);
  }

  function openEdit(brand) {
    setEditBrand(brand);
    setName(brand.name);
    setLogoUrl(brand.logoUrl || '');
    initialValues.current = { name: brand.name, logoUrl: brand.logoUrl || '' };
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setName('');
    setLogoUrl('');
    setEditBrand(null);
  }

  const hasUnsavedChanges = name !== initialValues.current.name || logoUrl !== initialValues.current.logoUrl;

  async function handleSave() {
    if (!name.trim()) { toast.error('Nomi talab qilinadi'); return; }
    setSaving(true);
    try {
      if (editBrand) {
        await api.patch(`/brands/${editBrand.id}`, { name: name.trim(), logoUrl: logoUrl.trim() || null });
      } else {
        await api.post('/brands', { name: name.trim(), logoUrl: logoUrl.trim() || null });
      }
      toast.success(t('common.save'));
      closeModal();
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(brand) {
    if (!confirm(`${brand.name}ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/brands/${brand.id}`);
      toast.success(t('common.delete'));
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('home.brands')}</h1>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Yangi brend</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Logo</th>
                <th className="p-3">Nomi</th>
                <th className="p-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        ref={modalRef}
        open={showModal}
        onClose={() => setShowModal(false)}
        onCloseConfirmed={closeModal}
        title={editBrand ? 'Brendni tahrirlash' : 'Yangi brend'}
        hasUnsavedChanges={hasUnsavedChanges}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Nomi</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Samsung" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Logo URL (ixtiyoriy)</label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : t('common.save')}</Button>
            <Button variant="outline" onClick={() => modalRef.current?.handleClose()}>{t('common.cancel')}</Button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
