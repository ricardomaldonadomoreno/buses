import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export function WeMoveCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="container max-w-3xl text-center">
        <div className="bg-primary border-4 border-foreground p-8 md:p-12 shadow-[8px_8px_0px_0px_hsl(var(--foreground))]">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-primary-foreground">
            {t('weMove.cta.title')}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            {t('weMove.cta.description')}
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2 border-4 border-foreground font-bold"
          >
            <UserPlus className="h-5 w-5" />
            {t('weMove.cta.button')}
          </Button>
        </div>
      </div>
    </section>
  );
}
