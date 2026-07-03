import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Ban, CheckCircle, Eye, EyeOff } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';

export default function AdminUsers() {
  const user = useAuthStore((s) => s.user);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', username: '', password: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const modalRef = useRef(null);
  const isSuperAdmin = user?.adminLevel === 'SUPER_ADMIN';
  const EMPTY_FORM = { name: '', email: '', phone: '', username: '', password: '' };
  const hasUnsavedChanges = Object.keys(EMPTY_FORM).some((k) => formData[k] !== EMPTY_FORM[k]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAdmins();
  }, [isSuperAdmin]);

  async function loadAdmins() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin-users');
      const filtered = (data.admins || []).filter((a) => a.id !== user?.id);
      setAdmins(filtered);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Adminlarni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Faqat Super Admin bu sahifani ko'ra oladi.</p>
      </div>
    );
  }

  async function handleCreate() {
    if (!formData.name || !formData.email || !formData.phone || !formData.username || !formData.password) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/admin-users', {
        ...formData,
      });
      toast.success('Yordamchi admin yaratildi');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', username: '', password: '' });
      loadAdmins();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleStatus(adminId) {
    try {
      await api.patch(`/admin-users/${adminId}/status`);
      toast.success('Holat o\'zgartirildi');
      loadAdmins();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  async function handleDelete(adminId) {
    if (!confirm('Bu adminni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/admin-users/${adminId}`);
      toast.success('Admin o\'chirildi');
      loadAdmins();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  }

  function togglePasswordVisibility(id) {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">👑 Adminlarni boshqarish</h1>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi yordamchi admin
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Ism</th>
                <th className="p-3">Email</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Login</th>
                <th className="p-3">Parol</th>
                <th className="p-3">Darajasi</th>
                <th className="p-3">Holat</th>
                <th className="p-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{admin.name}</td>
                  <td className="p-3 text-muted-foreground">{admin.email}</td>
                  <td className="p-3 text-muted-foreground">{admin.phone}</td>
                  <td className="p-3">
                    {admin.username ? (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {admin.username}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {admin.credentialPassword ? (
                      <div className="flex items-center gap-1">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {visiblePasswords[admin.id] ? admin.credentialPassword : '••••••'}
                        </code>
                        <button
                          onClick={() => togglePasswordVisibility(admin.id)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          {visiblePasswords[admin.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={admin.adminLevel === 'SUPER_ADMIN' ? 'default' : 'outline'}>
                      {admin.adminLevel === 'SUPER_ADMIN' ? '👑 Super Admin' : '👨‍💼 Yordamchi'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {admin.status === 'ACTIVE' ? 'Faol' : 'Bloklangan'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {admin.adminLevel !== 'SUPER_ADMIN' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(admin.id)}
                            title={admin.status === 'ACTIVE' ? 'Bloklash' : 'Faollash'}
                          >
                            {admin.status === 'ACTIVE' ? (
                              <Ban className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-success" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(admin.id)}
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {admin.adminLevel === 'SUPER_ADMIN' && (
                        <span className="text-xs text-muted-foreground">Super Admin</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        ref={modalRef}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCloseConfirmed={() => setFormData({ ...EMPTY_FORM })}
        title="Yangi yordamchi admin"
        hasUnsavedChanges={hasUnsavedChanges}
        maxWidth="md"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Ism</label>
            <Input
              placeholder="Ism"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Telefon</label>
            <Input
              placeholder="+998901234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Login (username)</label>
            <Input
              placeholder="Masalan: admin2"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Parol</label>
            <Input
              placeholder="Kamida 6 ta belgi"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => modalRef.current?.handleClose()}
            className="flex-1"
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? 'Yaratilmoqda...' : 'Yaratish'}
          </Button>
        </div>
      </AdminModal>
    </div>
  );
}
