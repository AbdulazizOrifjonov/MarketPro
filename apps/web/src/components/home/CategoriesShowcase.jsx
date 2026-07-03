import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoriesShowcase() {
  const { t, i18n } = useTranslation();
  const { categories, isLoading } = useCategoryTree();

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold sm:text-xl">{t('home.categories')}</h2>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {localizedField(cat, 'name', i18n.language)[0]}
                </div>
              )}
              <span className="line-clamp-2 text-xs font-medium sm:text-sm">
                {localizedField(cat, 'name', i18n.language)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
