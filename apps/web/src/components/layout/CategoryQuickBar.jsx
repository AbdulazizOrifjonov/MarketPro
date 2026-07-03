import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, Home, Wrench, Gamepad2, Shirt, Tag, Package } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';

const ICONS = [Smartphone, Home, Wrench, Gamepad2, Shirt, Tag, Package];

export function CategoryQuickBar() {
  const { i18n } = useTranslation();
  const { categories, isLoading } = useCategoryTree();

  if (isLoading || categories.length === 0) return null;

  return (
    <div className="hidden border-b border-border bg-background lg:block">
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-6 scrollbar-hide">
        {categories.slice(0, 7).map((cat, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-foreground/75 transition-colors hover:border-primary hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {localizedField(cat, 'name', i18n.language)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
