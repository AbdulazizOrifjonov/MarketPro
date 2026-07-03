import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AddressForm } from '@/components/account/AddressForm';

function formatAddress(addr) {
  return [addr.region, addr.district, addr.neighborhood, addr.street, addr.houseNumber && `${addr.houseNumber}-uy`]
    .filter(Boolean)
    .join(', ');
}

export default function Addresses() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    api
      .get('/users/me/addresses')
      .then(({ data }) => setAddresses(data.addresses))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(form) {
    setIsSaving(true);
    try {
      await api.post('/users/me/addresses', form);
      setShowForm(false);
      toast.success(t('common.save'));
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/users/me/addresses/${id}`);
    toast.success(t('common.delete'));
    load();
  }

  async function handleSetDefault(id) {
    await api.patch(`/users/me/addresses/${id}`, { isDefault: true });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('account.addresses')}</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> {t('account.add_address')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-dashed border-border p-4">
          <AddressForm onSave={handleCreate} onCancel={() => setShowForm(false)} saving={isSaving} />
        </div>
      )}

      {!isLoading && addresses.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      )}

      <div className="space-y-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm">{formatAddress(addr)}</p>
                {addr.isDefault && <span className="text-xs font-medium text-primary">{t('account.default_address')}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {!addr.isDefault && (
                <Button variant="ghost" size="icon" onClick={() => handleSetDefault(addr.id)} aria-label="set default">
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} aria-label="delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
