import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function CategoryNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/categories" className="rounded-lg p-2 hover:bg-accent" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('common.add')}: {t('admin.categories')}</h1>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <CategoryForm onSaved={() => navigate('/admin/categories')} onCancel={() => navigate('/admin/categories')} />
        </CardContent>
      </Card>
    </div>
  );
}
