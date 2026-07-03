import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';

function CategoryNode({ category, depth }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasChildren = category.children?.length > 0;
  const name = localizedField(category, 'name', i18n.language);

  return (
    <div>
      <div
        className="flex items-center justify-between rounded-md transition-colors hover:bg-accent"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Link to={`/catalog?category=${category.slug}`} className="flex-1 px-2 py-2 text-sm text-foreground/90">
          {name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label="toggle"
            className="p-2 text-muted-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {hasChildren && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {category.children.map((child) => (
              <CategoryNode key={child.id} category={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HomeCategorySidebar() {
  const { t } = useTranslation();
  const { categories, isLoading } = useCategoryTree();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20">
        {isLoading && <div className="px-2 py-2 text-sm text-muted-foreground">{t('common.loading')}</div>}
        {!isLoading && categories.length === 0 && (
          <div className="px-2 py-2 text-sm text-muted-foreground">{t('common.no_results')}</div>
        )}
        {categories.map((cat) => (
          <CategoryNode key={cat.id} category={cat} depth={0} />
        ))}
      </div>
    </aside>
  );
}
