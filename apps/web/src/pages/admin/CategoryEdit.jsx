import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function CategoryEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/categories/id/${id}`)
      .then(({ data }) => setCategory(data.category))
      .catch(() => setCategory(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/categories" className="rounded-lg p-2 hover:bg-accent" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('common.edit')}: {t('admin.categories')}</h1>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : category ? (
            <CategoryForm
              category={category}
              onSaved={() => navigate('/admin/categories')}
              onCancel={() => navigate('/admin/categories')}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
