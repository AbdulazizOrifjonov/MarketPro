import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, Percent, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AdminModal from '@/components/admin/AdminModal';
import { formatUZS } from '@/lib/utils';

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [discountProduct, setDiscountProduct] = useState(null);
  const [discountPct, setDiscountPct] = useState(10);
  const [discountPrice, setDiscountPrice] = useState('');
  const [discountHours, setDiscountHours] = useState(12);
  const [discountBusy, setDiscountBusy] = useState(false);
  const discountModalRef = useRef(null);

  function load(p, q) {
    setIsLoading(true);
    const params = { page: p || page, limit: 50 };
    if (q ?? search) params.search = q ?? search;
    api.get('/products/admin/all', { params }).then(({ data }) => {
      setProducts(data.products);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    }).finally(() => setIsLoading(false));
  }

  useEffect(() => { load(1, ''); }, []);

  function handleSearch(val) {
    setSearch(val);
    load(1, val);
  }

  async function handleDelete(product) {
    if (!confirm(`${product.nameUz}ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      toast.success(t('common.delete'));
      load();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  function openDiscount(p) {
    setDiscountProduct(p);
    setDiscountPct(10);
    setDiscountPrice('');
    setDiscountHours(12);
  }

  function closeDiscount() { setDiscountProduct(null); }

  function handlePctChange(pct) {
    const val = Math.max(0, Math.min(100, Number(pct) || 0));
    setDiscountPct(val);
    if (discountProduct) setDiscountPrice(String(Math.round(discountProduct.price * (1 - val / 100))));
  }

  function handlePriceChange(val) {
    setDiscountPrice(val);
    const sale = parseFloat(val);
    if (discountProduct && sale > 0) setDiscountPct(Math.max(0, Math.min(100, Math.round(100 - (sale / discountProduct.price) * 100))));
  }

  async function handleApplyDiscount() {
    if (!discountProduct) return;
    const salePrice = parseFloat(discountPrice);
    if (!salePrice || salePrice <= 0) { toast.error('Chegirma narxini to\'g\'ri kiriting'); return; }
    if (salePrice >= discountProduct.price) { toast.error('Chegirma narxi asl narxdan kichik bo\'lishi kerak'); return; }
    setDiscountBusy(true);
    try {
      await api.patch(`/products/${discountProduct.id}`, { discountPrice: salePrice, price: discountProduct.price });
      const { data } = await api.get('/flash-sale/active');
      let sale = data.flashSale;
      if (sale) {
        try { await api.post(`/flash-sale/${sale.id}/items`, { productId: discountProduct.id }); } catch { /* already exists */ }
      } else {
        await api.post('/flash-sale', { hours: discountHours, productIds: [discountProduct.id] });
      }
      toast.success('Chegirma qo\'shildi!');
      closeDiscount();
      load();
    } catch (err) { toast.error(err.friendlyMessage || 'Xatolik'); } finally { setDiscountBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t('admin.products')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 pr-8" placeholder="Qidirish..." value={search} onChange={(e) => handleSearch(e.target.value)} />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" asChild><Link to="/admin/products/new"><Plus className="h-4 w-4" /> {t('admin.add_product')}</Link></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Mahsulot</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Narx</th>
                  <th className="p-3">Zaxira</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="flex items-center gap-2 p-3">
                      <img src={p.images?.[0]?.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="line-clamp-1 max-w-[200px]">{p.nameUz}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.sku}</td>
                    <td className="p-3 font-medium">{formatUZS(p.discountPrice ?? p.price)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3"><Badge variant={p.isActive ? 'success' : 'secondary'}>{p.isActive ? 'Faol' : 'Nofaol'}</Badge></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDiscount(p)} title="Chegirma berish"><Percent className="h-4 w-4 text-amber-500" /></Button>
                        <Button variant="ghost" size="icon" asChild><a href={`/product/${p.slug}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a></Button>
                        <Button variant="ghost" size="icon" asChild><Link to={`/admin/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </>
      )}

      <AdminModal
        open={!!discountProduct}
        onClose={closeDiscount}
        onCloseConfirmed={closeDiscount}
        title="Chegirma berish"
        hasUnsavedChanges={!!discountProduct && (discountPct !== 10 || discountPrice !== '' || discountHours !== 12)}
        maxWidth="md"
      >
        {discountProduct && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <img src={discountProduct.images?.[0]?.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div><p className="font-medium text-sm">{discountProduct.nameUz}</p><p className="text-xs text-muted-foreground">Asl narx: {formatUZS(discountProduct.price)}</p></div>
            </div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-sm font-medium">Chegirma foizi (%)</label><Input type="number" min={0} max={100} value={discountPct} onChange={(e) => handlePctChange(e.target.value)} /></div>
              <div><label className="mb-1 block text-sm font-medium">Chegirma narxi (so'm)</label><Input type="number" min={0} value={discountPrice} onChange={(e) => handlePriceChange(e.target.value)} placeholder="Chegirmadagi narx" /></div>
              <div><label className="mb-1 block text-sm font-medium">Aksiya davomiyligi (soat)</label><Input type="number" min={1} max={720} value={discountHours} onChange={(e) => setDiscountHours(Number(e.target.value))} /></div>
              {discountPrice && parseFloat(discountPrice) > 0 && (
                <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm"><span className="text-muted-foreground">Siz: </span><span className="font-bold text-primary">{formatUZS(parseFloat(discountPrice))}</span><span className="text-muted-foreground"> (</span><span className="text-destructive">-{discountPct}%</span><span className="text-muted-foreground"> tejaysiz)</span></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={handleApplyDiscount} disabled={discountBusy}>{discountBusy ? 'Saqlanmoqda...' : 'Chegirma qo\'shish'}</Button>
              <Button variant="outline" onClick={closeDiscount}>Bekor qilish</Button>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
