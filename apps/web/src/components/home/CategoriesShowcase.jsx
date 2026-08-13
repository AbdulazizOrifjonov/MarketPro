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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-18 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
            >
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt="" className="h-12 w-12 shrink-0 object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {localizedField(cat, 'name', i18n.language)[0]}
                </div>
              )}
              <span className="line-clamp-2 flex-1 text-xs font-semibold sm:text-sm transition-colors group-hover:text-primary">
                {localizedField(cat, 'name', i18n.language)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
