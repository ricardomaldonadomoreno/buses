import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  loading?: boolean;
}

export function NotificationsPanel({ notifications, loading }: NotificationsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="border-4 border-foreground bg-card p-4">
      <h3 className="font-bold text-lg border-b-2 border-foreground pb-2 mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        {t('landing.notifications.title')}
      </h3>
      
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border-2 border-border">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="p-3 border-2 border-border bg-muted/50">
              <h4 className="font-bold text-sm">{notification.title}</h4>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {t('landing.notifications.empty')}
          </p>
        )}
      </div>
    </div>
  );
}