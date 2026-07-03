import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';
import { cn } from '@/lib/utils';

export function CatalogMegaMenu({ open, onClose }) {
  const { i18n } = useTranslation();
  const { categories, isLoading } = useCategoryTree();
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (open && categories.length > 0 && !activeId) {
      setActiveId(categories[0].id);
    }
  }, [open, categories, activeId]);

  if (!open) return null;

  const active = categories.find((c) => c.id === activeId) || categories[0];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full z-50 hidden border-t border-border bg-popover shadow-2xl lg:block">
        <div className="mx-auto flex max-w-[1440px]" style={{ minHeight: 380 }}>
          <div className="w-64 shrink-0 overflow-y-auto border-r border-border py-3">
            {isLoading && <p className="px-5 py-2 text-sm text-muted-foreground">...</p>}
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onMouseEnter={() => setActiveId(cat.id)}
                onClick={() => setActiveId(cat.id)}
                className={cn(
                  'flex w-full items-center justify-between px-5 py-2.5 text-left text-sm font-medium transition-colors',
                  active?.id === cat.id ? 'bg-primary/10 text-primary' : 'text-foreground/85 hover:bg-accent'
                )}
              >
                {localizedField(cat, 'name', i18n.language)}
                <ChevronRight className="h-4 w-4 opacity-40" />
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">
            {active && (
              <>
                <Link
                  to={`/catalog?category=${active.slug}`}
                  onClick={onClose}
                  className="mb-4 inline-flex items-center gap-1.5 text-base font-bold hover:text-primary"
                >
                  {localizedField(active, 'name', i18n.language)}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {active.children?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-x-8 gap-y-3 xl:grid-cols-4">
                    {active.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/catalog?category=${child.slug}`}
                        onClick={onClose}
                        className="text-sm text-foreground/75 hover:text-primary"
                      >
                        {localizedField(child, 'name', i18n.language)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Bo'limlar hozircha qo'shilmagan</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
