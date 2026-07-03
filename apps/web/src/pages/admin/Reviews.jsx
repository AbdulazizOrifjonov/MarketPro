import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  function load(p) {
    setIsLoading(true);
    api.get('/reviews/all', { params: { page: p || page, limit: 30 } }).then(({ data }) => {
      setReviews(data.reviews);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    }).finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("O'chirildi");
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Sharhlar</h1>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha sharhlar yo'q</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[650px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Mahsulot</th>
                  <th className="p-3">Foydalanuvchi</th>
                  <th className="p-3">Reyting</th>
                  <th className="p-3">Sharh</th>
                  <th className="p-3">Sana</th>
                  <th className="p-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <Link to={`/product/${r.product.slug}`} className="text-primary hover:underline line-clamp-1">{r.product.nameUz}</Link>
                    </td>
                    <td className="p-3">{r.user.name}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {r.rating}
                      </span>
                    </td>
                    <td className="p-3 max-w-[250px] line-clamp-2 text-muted-foreground">{r.comment || '-'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
