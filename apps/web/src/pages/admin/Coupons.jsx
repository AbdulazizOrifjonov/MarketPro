import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Coupons() {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    api
      .get('/coupons')
      .then(({ data }) => setCoupons(data.coupons))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function handleDelete(coupon) {
    if (!confirm(`${coupon.code}ni o'chirishni tasdiqlaysizmi?`)) return;
    await api.delete(`/coupons/${coupon.id}`);
    toast.success(t('common.delete'));
    load();
  }

  async function toggleActive(coupon) {
    await api.patch(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('admin.coupons')}</h1>
        <Button size="sm" asChild>
          <Link to="/admin/coupons/new">
            <Plus className="h-4 w-4" /> {t('common.add')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Kod</th>
                <th className="p-3">Qiymat</th>
                <th className="p-3">Min. buyurtma</th>
                <th className="p-3">Ishlatilgan</th>
                <th className="p-3">Holat</th>
                <th className="p-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono font-semibold">{c.code}</td>
                  <td className="p-3">{c.type === 'PERCENT' ? `${c.value}%` : `${c.value} so'm`}</td>
                  <td className="p-3">{c.minOrder}</td>
                  <td className="p-3">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                      <Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Faol' : 'Nofaol'}</Badge>
                    </Button>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
