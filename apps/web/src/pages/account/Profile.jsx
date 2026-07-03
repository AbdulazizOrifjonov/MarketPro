import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';

export default function Profile() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch('/users/me', { name, phone });
      await fetchMe();
      toast.success(t('common.save'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const { data } = await api.post('/upload/avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = data.files[0]?.url;
      await api.patch('/users/me', { avatarUrl });
      await fetchMe();
      toast.success(t('common.save'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="max-w-lg rounded-xl border border-border bg-card p-6">
      <h1 className="mb-5 text-xl font-bold">{t('account.edit_profile')}</h1>

      <div className="mb-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="group relative h-16 w-16 shrink-0 rounded-full"
          aria-label="change avatar"
        >
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="text-lg">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            {isUploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </button>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t('auth.name')}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t('auth.phone')}</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </form>
    </div>
  );
}
