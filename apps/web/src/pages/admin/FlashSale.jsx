import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Zap, Plus, Trash2, X, Search, Clock, Power, PowerOff } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { localizedField } from '@/lib/localize';
import { formatUZS } from '@/lib/utils';

export default function AdminFlashSale() {
  const { t, i18n } = useTranslation();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [hours, setHours] = useState(12);
  const [creating, setCreating] = useState(false);

  const createModalRef = useRef(null);
  const addProductModalRef = useRef(null);
  const hasUnsavedCreate = hours !== 12;

  const [showAddProduct, setShowAddProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => { loadSales(); }, []);

  async function loadSales() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/flash-sale');
      setSales(data.flashSales || []);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await api.post('/flash-sale', { hours });
      toast.success('Flash sale yaratildi!');
      setShowCreate(false);
      setHours(12);
      loadSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(sale) {
    try {
      await api.patch(`/flash-sale/${sale.id}`, { isActive: !sale.isActive });
      toast.success(sale.isActive ? "O'chirildi" : 'Faollashtirildi');
      loadSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    }
  }

  async function handleDelete(saleId) {
    if (!confirm("Bu aksiyani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/flash-sale/${saleId}`);
      toast.success("O'chirildi");
      loadSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    }
  }

  useEffect(() => {
    if (debouncedQuery.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    api.get('/products', { params: { search: debouncedQuery, limit: 10 } }).then(({ data }) => {
      setSearchResults(data.products || []);
    }).finally(() => setSearching(false));
  }, [debouncedQuery]);

  function handleSearchChange(q) {
    setSearchQuery(q);
  }

  async function addProduct(saleId, productId) {
    try {
      await api.post(`/flash-sale/${saleId}/items`, { productId });
      toast.success("Mahsulot qo'shildi");
      setShowAddProduct(null);
      setSearchQuery('');
      setSearchResults([]);
      loadSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Bu mahsulot allaqachon qo\'shilgan');
    }
  }

  async function removeProduct(saleId, itemId) {
    try {
      await api.delete(`/flash-sale/${saleId}/items/${itemId}`);
      toast.success("Mahsulot o'chirildi");
      loadSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik');
    }
  }

  function formatTimeLeft(endsAt) {
    const diff = new Date(endsAt) - Date.now();
    if (diff <= 0) return 'Tugagan';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h} soat ${m} daqiqa qoldi`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Zap className="h-5 w-5 text-amber-500" />
          {t('admin.flash_sale')}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4" /> Yangi mahsulot
            </Link>
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi aksiya
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Hozircha aksiya yo'q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <Badge variant={sale.isActive && new Date(sale.endsAt) > new Date() ? 'default' : 'secondary'}>
                    {sale.isActive && new Date(sale.endsAt) > new Date() ? 'Faol' : 'Nofaol'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTimeLeft(sale.endsAt)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sale.items.length} ta mahsulot
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={() => setShowAddProduct(sale.id)} title="Mahsulot qo'shish">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(sale)} title={sale.isActive ? "O'chirish" : 'Faollashtirish'}>
                    {sale.isActive ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-success" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {sale.items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Mahsulotlar qo'shilmagan</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                        <img
                          src={item.product.images?.[0]?.url}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover bg-muted"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{localizedField(item.product, 'name', i18n.language)}</p>
                          <div className="flex items-center gap-2 text-xs">
                            {item.product.discountPrice ? (
                              <>
                                <span className="font-bold text-primary">{formatUZS(item.product.discountPrice)}</span>
                                <span className="text-muted-foreground line-through">{formatUZS(item.product.price)}</span>
                              </>
                            ) : (
                              <span className="font-bold">{formatUZS(item.product.price)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeProduct(sale.id, item.id)}
                          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        ref={createModalRef}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCloseConfirmed={() => { setShowCreate(false); setHours(12); }}
        title="Yangi Flash Sale"
        hasUnsavedChanges={hasUnsavedCreate}
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Davomiyligi (soat)</label>
            <Input type="number" min={1} max={72} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={creating}>
            {creating ? 'Yaratilmoqda...' : 'Yaratish'}
          </Button>
        </div>
      </AdminModal>

      <AdminModal
        ref={addProductModalRef}
        open={!!showAddProduct}
        onClose={() => { setShowAddProduct(null); setSearchQuery(''); setSearchResults([]); }}
        onCloseConfirmed={() => { setShowAddProduct(null); setSearchQuery(''); setSearchResults([]); }}
        title="Mahsulot qo'shish"
        maxWidth="lg"
      >
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-8"
            placeholder="Mahsulot nomini qidiring..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {searching && <p className="py-4 text-center text-sm text-muted-foreground">Qidirilmoqda...</p>}
          {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Mahsulot topilmadi</p>
          )}
          {searchResults.map((product) => (
            <button
              key={product.id}
              onClick={() => addProduct(showAddProduct, product.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
            >
              <img src={product.images?.[0]?.url} alt="" className="h-10 w-10 rounded-lg object-cover bg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{localizedField(product, 'name', i18n.language)}</p>
                <p className="text-xs text-muted-foreground">{formatUZS(product.discountPrice || product.price)}</p>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-primary" />
            </button>
          ))}
        </div>
      </AdminModal>
    </div>
  );
}
