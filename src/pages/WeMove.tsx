import { useTranslation } from 'react-i18next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Users } from 'lucide-react';

const WeMove = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 container py-16 flex flex-col items-center justify-center text-center">
        <Users className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl font-black mb-4">{t('landing.weMove.title')}</h1>
        <p className="text-xl text-muted-foreground">{t('landing.weMove.subtitle')}</p>
        <p className="mt-8 text-muted-foreground">Próximamente...</p>
      </main>
      <LandingFooter />
    </div>
  );
};

export default WeMove;