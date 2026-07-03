import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Sliders() {
  const { t } = useTranslation();
  const [sliders, setSliders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    api
      .get('/sliders/admin/all')
      .then(({ data }) => setSliders(data.sliders))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function handleDelete(slider) {
    if (!confirm(`${slider.title}ni o'chirishni tasdiqlaysizmi?`)) return;
    await api.delete(`/sliders/${slider.id}`);
    toast.success(t('common.delete'));
    load();
  }

  async function toggleActive(slider) {
    await api.patch(`/sliders/${slider.id}`, { isActive: !slider.isActive });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('admin.sliders')}</h1>
        <Button size="sm" asChild>
          <Link to="/admin/sliders/new">
            <Plus className="h-4 w-4" /> {t('common.add')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {sliders.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <img src={s.imageUrl} alt="" className="h-14 w-24 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleActive(s)}>
                {s.isActive ? 'Faol' : 'Nofaol'}
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/admin/sliders/${s.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
