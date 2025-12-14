import { useTranslation } from 'react-i18next';
import { Search, Camera, Wallet, CheckCircle } from 'lucide-react';

const steps = [
  { key: 'step1', icon: Search },
  { key: 'step2', icon: Camera },
  { key: 'step3', icon: Wallet },
  { key: 'step4', icon: CheckCircle },
];

export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="border-b-2 border-foreground bg-secondary">
      <div className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('landing.howItWorks.title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="relative border-2 border-foreground bg-background p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-3 -left-3 h-8 w-8 border-2 border-foreground bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">{index + 1}</span>
                </div>
                <div className="pt-4 space-y-4">
                  <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg">
                    {t(`landing.howItWorks.${step.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.howItWorks.${step.key}.description`)}
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
