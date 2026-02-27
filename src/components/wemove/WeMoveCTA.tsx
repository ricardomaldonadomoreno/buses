import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Smartphone, TrendingUp, Bus, Users } from 'lucide-react';

export function WeMoveCTA() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const perks = [
    { icon: Bus,        key: 'weMove.cta.perk1' },
    { icon: TrendingUp, key: 'weMove.cta.perk2' },
    { icon: Smartphone, key: 'weMove.cta.perk3' },
    { icon: Users,      key: 'weMove.cta.perk4' },
  ];

  return (
    <section className="bg-foreground text-background py-16">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-background/40 mb-3">
              {t('weMove.cta.eyebrow')}
            </p>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              {t('weMove.cta.title')}
            </h2>
            <p className="text-background/60 text-base mb-8 leading-relaxed">
              {t('weMove.cta.desc')}
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/wemove/register')}
              className="bg-primary text-primary-foreground border-2 border-primary/80 font-black gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            >
              {t('weMove.cta.btn')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: perks */}
          <div className="grid grid-cols-1 gap-3">
            {perks.map(({ icon: Icon, key }, i) => (
              <div key={i} className="flex items-center gap-4 border border-background/10 bg-background/5 px-5 py-4 hover:bg-background/10 transition-colors">
                <div className="w-10 h-10 bg-primary border border-background/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm text-background">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
