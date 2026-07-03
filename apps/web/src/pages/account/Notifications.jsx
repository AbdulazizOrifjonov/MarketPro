import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    api
      .get('/notifications')
      .then(({ data }) => setNotifications(data.notifications))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    load();
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  if (!isLoading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <BellOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('common.no_results')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('account.notifications')}</h1>
        <Button variant="ghost" size="sm" onClick={markAllRead}>
          Hammasini o'qilgan deb belgilash
        </Button>
      </div>
      {notifications.map((n) => (
        <button
          key={n.id}
          onClick={() => markRead(n.id)}
          className={cn(
            'flex w-full items-start gap-3 rounded-xl border p-4 text-left',
            n.isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
          )}
        >
          <Bell className={cn('mt-0.5 h-4 w-4 shrink-0', n.isRead ? 'text-muted-foreground' : 'text-primary')} />
          <div>
            <p className="text-sm">{n.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
