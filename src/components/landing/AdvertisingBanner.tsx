import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

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
    <div
      className="relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center text-center p-6"
      style={{
        background: 'linear-gradient(135deg, #D4AF37 0%, #EFBF04 60%, #B8962E 100%)',
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-40 bg-white/20 rounded-lg mx-auto" />
            <div className="h-4 w-24 bg-white/20 rounded-lg mx-auto" />
          </div>
        ) : activeAd?.image_url ? (
          <img
            src={activeAd.image_url}
            alt={activeAd.title}
            className="max-w-full max-h-[180px] object-contain"
          />
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-white/95 leading-snug">
              {activeAd?.title || t('landing.advertising.title')}
            </h2>
            <p className="text-white/70 text-sm mt-1 font-medium tracking-wide">
              {t('landing.advertising.subtitle')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
