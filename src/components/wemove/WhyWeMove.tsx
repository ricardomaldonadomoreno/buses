import { useTranslation } from 'react-i18next';
import { Users, ShieldCheck, Star, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function WhyWeMove() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Users,
      titleKey: 'weMove.whyWeMove.realCommunity.title',
      descKey: 'weMove.whyWeMove.realCommunity.description',
    },
    {
      icon: ShieldCheck,
      titleKey: 'weMove.whyWeMove.verifiedPeople.title',
      descKey: 'weMove.whyWeMove.verifiedPeople.description',
    },
    {
      icon: Star,
      titleKey: 'weMove.whyWeMove.visibleReputation.title',
      descKey: 'weMove.whyWeMove.visibleReputation.description',
    },
    {
      icon: Heart,
      titleKey: 'weMove.whyWeMove.noBusiness.title',
      descKey: 'weMove.whyWeMove.noBusiness.description',
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <h2 className="text-3xl font-black text-center mb-12 text-foreground">
          {t('weMove.whyWeMove.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] text-center"
            >
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center border-4 border-foreground">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground text-sm">{t(feature.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
