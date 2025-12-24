import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
}

interface AdvertisingBannerProps {
  ads: Ad[];
  loading?: boolean;
}

export function AdvertisingBanner({ ads, loading }: AdvertisingBannerProps) {
  const { t } = useTranslation();

  const activeAd = ads[0];

  return (
    <div className="border-4 border-foreground bg-primary p-6 min-h-[250px] flex flex-col items-center justify-center text-center">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-primary-foreground/20 rounded mb-2" />
          <div className="h-6 w-32 bg-primary-foreground/20 rounded" />
        </div>
      ) : activeAd?.image_url ? (
        <img 
          src={activeAd.image_url} 
          alt={activeAd.title}
          className="max-w-full max-h-[200px] object-contain"
        />
      ) : (
        <>
          <Megaphone className="h-16 w-16 text-primary-foreground mb-4" />
          <h2 className="font-black text-2xl text-primary-foreground">
            {activeAd?.title || t('landing.advertising.title')}
          </h2>
          <p className="text-primary-foreground/80 text-lg mt-2">
            {t('landing.advertising.subtitle')}
          </p>
        </>
      )}
    </div>
  );
}