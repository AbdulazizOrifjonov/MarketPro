import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { localizedField } from '@/lib/localize';
import { cn } from '@/lib/utils';

function CategoryNode({ category, depth, onNavigate }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasChildren = category.children?.length > 0;
  const name = localizedField(category, 'name', i18n.language);

  return (
    <div>
      <div
        className="flex items-center justify-between rounded-md hover:bg-accent transition-colors"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Link
          to={`/catalog?category=${category.slug}`}
          onClick={onNavigate}
          className="flex-1 px-2 py-2 text-sm text-foreground/90"
        >
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
              <CategoryNode key={child.id} category={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { categories, isLoading } = useCategoryTree();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-[280px] max-w-[85vw] overflow-y-auto bg-card border-r border-border shadow-xl transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-semibold">{t('nav.categories')}</span>
          <button onClick={onClose} aria-label="close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3">
          {isLoading && <div className="px-2 py-2 text-sm text-muted-foreground">{t('common.loading')}</div>}
          {!isLoading && categories.length === 0 && (
            <div className="px-2 py-2 text-sm text-muted-foreground">{t('common.no_results')}</div>
          )}
          {categories.map((cat) => (
            <CategoryNode key={cat.id} category={cat} depth={0} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </>
  );
}
