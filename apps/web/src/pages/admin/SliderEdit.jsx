import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SliderForm } from '@/components/admin/SliderForm';

export default function SliderEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [slider, setSlider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/sliders/admin/all')
      .then(({ data }) => setSlider(data.sliders.find((s) => s.id === id) || null))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/sliders" className="rounded-lg p-2 hover:bg-accent" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('common.edit')}: {t('admin.sliders')}</h1>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : slider ? (
            <SliderForm
              slider={slider}
              onSaved={() => navigate('/admin/sliders')}
              onCancel={() => navigate('/admin/sliders')}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
