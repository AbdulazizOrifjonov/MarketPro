import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SliderForm } from '@/components/admin/SliderForm';

export default function SliderNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/sliders" className="rounded-lg p-2 hover:bg-accent" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('common.add')}: {t('admin.sliders')}</h1>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <SliderForm onSaved={() => navigate('/admin/sliders')} onCancel={() => navigate('/admin/sliders')} />
        </CardContent>
      </Card>
    </div>
  );
}
