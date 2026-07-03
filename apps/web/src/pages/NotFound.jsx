import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground">{t('common.no_results')}</p>
      <Button asChild>
        <Link to="/">{t('common.back')}</Link>
      </Button>
    </div>
  );
}
