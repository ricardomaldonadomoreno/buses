import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
}

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
}

interface SiteSetting {
  key: string;
  value: string | null;
}

export function useLandingData() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [notificationsRes, adsRes, settingsRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('id, title, message')
          .order('created_at', { ascending: false }),
        supabase
          .from('ads')
          .select('id, title, image_url')
          .order('created_at', { ascending: false }),
        supabase
          .from('site_settings')
          .select('key, value')
      ]);

      if (notificationsRes.data) {
        setNotifications(notificationsRes.data);
      }

      if (adsRes.data) {
        setAds(adsRes.data);
      }

      if (settingsRes.data) {
        const settingsMap: Record<string, string> = {};
        settingsRes.data.forEach((setting: SiteSetting) => {
          if (setting.value) {
            settingsMap[setting.key] = setting.value;
          }
        });
        setSettings(settingsMap);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return { notifications, ads, settings, loading };
}