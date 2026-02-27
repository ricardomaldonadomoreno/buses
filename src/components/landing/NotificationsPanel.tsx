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
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="font-semibold text-sm text-foreground">
          {t('landing.notifications.title')}
        </h3>
        {notifications.length > 0 && (
          <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-border/40 max-h-[220px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-shimmer rounded-xl h-12" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n.id} className="px-5 py-3.5 hover:bg-muted/40 transition-colors">
              <p className="text-xs font-semibold text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t('landing.notifications.empty')}
          </p>
        )}
      </div>
    </div>
  );
}
