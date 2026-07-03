import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CouponForm } from '@/components/admin/CouponForm';

export default function CouponNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/coupons" className="rounded-lg p-2 hover:bg-accent" aria-label="back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('common.add')}: {t('admin.coupons')}</h1>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <CouponForm onSaved={() => navigate('/admin/coupons')} onCancel={() => navigate('/admin/coupons')} />
        </CardContent>
      </Card>
    </div>
  );
}
