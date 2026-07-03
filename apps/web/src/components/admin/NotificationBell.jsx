import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function loadNotifications() {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only show order notifications
  const orderNotifications = notifications.filter((n) =>
    n.type === 'ORDER_CREATED' || n.type === 'ORDER_STATUS'
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative cursor-pointer p-2 rounded-lg transition-colors',
          unreadCount > 0
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'text-foreground/70 hover:bg-muted'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold">Ogohlantiruvchilar</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Barchasini o'qilgan deb belgilash
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {orderNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Ogohlantiruvchi yo'q
              </div>
            ) : (
              orderNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'border-b border-border px-4 py-3 transition-colors',
                    !notif.isRead && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notif.isRead && 'font-semibold')}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
