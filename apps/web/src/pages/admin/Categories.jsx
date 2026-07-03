import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function CategoryRow({ category, depth, onDelete }) {
  const [open, setOpen] = useState(true);
  const hasChildren = category.children?.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-accent" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setOpen((v) => !v)}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-sm font-medium">{category.nameUz}</span>
          <span className="text-xs text-muted-foreground">/{category.slug}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/admin/categories/${category.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {hasChildren && open && category.children.map((child) => (
        <CategoryRow key={child.id} category={child} depth={depth + 1} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function Categories() {
  const { t } = useTranslation();
  const [tree, setTree] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    api
      .get('/categories/tree')
      .then(({ data }) => setTree(data.categories))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(category) {
    if (!confirm(`${category.nameUz}ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success(t('common.delete'));
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('admin.categories')}</h1>
        <Button size="sm" asChild>
          <Link to="/admin/categories/new">
            <Plus className="h-4 w-4" /> {t('common.add')}
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : (
          tree.map((cat) => <CategoryRow key={cat.id} category={cat} depth={0} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}
