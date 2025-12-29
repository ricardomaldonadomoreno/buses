import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';

interface WeMoveHeroProps {
  onSearchClick: () => void;
}

export function WeMoveHero({ onSearchClick }: WeMoveHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="py-16 text-center">
      <div className="container max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-primary">
          {t('weMove.title')}
        </h1>
        <p className="text-2xl font-bold text-foreground mb-2">
          {t('weMove.subtitle')}
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          {t('weMove.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="gap-2 border-4 border-foreground"
            onClick={onSearchClick}
          >
            <Search className="h-5 w-5" />
            {t('weMove.searchTransport')}
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2 border-4 border-foreground"
            onClick={() => navigate('/wemove/register')}
          >
            <UserPlus className="h-5 w-5" />
            {t('weMove.becomeTransporter')}
          </Button>
        </div>
      </div>
    </section>
  );
}
