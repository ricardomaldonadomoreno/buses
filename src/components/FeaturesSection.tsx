import { useTranslation } from 'react-i18next';
import { Shield, Camera, MapPin, Scale } from 'lucide-react';

const features = [
  { key: 'escrow', icon: Shield },
  { key: 'verification', icon: Camera },
  { key: 'tracking', icon: MapPin },
  { key: 'disputes', icon: Scale },
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="border-b-2 border-foreground bg-background">
      <div className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('landing.features.title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group border-2 border-foreground p-6 hover:bg-primary hover:text-primary-foreground transition-colors shadow-xs hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="h-14 w-14 border-2 border-foreground group-hover:border-primary-foreground bg-secondary group-hover:bg-primary-foreground flex items-center justify-center transition-colors">
                    <Icon className="h-7 w-7 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-bold text-xl">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground group-hover:text-primary-foreground/80 transition-colors">
                    {t(`landing.features.${feature.key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
