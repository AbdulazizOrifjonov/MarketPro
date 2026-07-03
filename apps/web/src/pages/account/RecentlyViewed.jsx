import { useTranslation } from 'react-i18next';
import { ProductRail } from '@/components/product/ProductRail';

export default function RecentlyViewed() {
  const { t } = useTranslation();
  return <ProductRail title={t('account.recently_viewed')} endpoint="/products/recently-viewed" />;
}
