// src/components/wemove/WeMoveCTA.tsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Bus, TrendingUp, Smartphone, Users, CheckCircle } from 'lucide-react';

const PERKS = [
  { icon: Bus,        key: 'weMove.cta.perk1' },
  { icon: TrendingUp, key: 'weMove.cta.perk2' },
  { icon: Smartphone, key: 'weMove.cta.perk3' },
  { icon: Users,      key: 'weMove.cta.perk4' },
];

export function WeMoveCTA() {
  const { t } = useTranslation();

  return (
    <section className="bg-foreground text-background py-20">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-4">
              {t('weMove.cta.eyebrow')}
            </p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-background"
              dangerouslySetInnerHTML={{ __html: t('weMove.cta.title') }} />
            <p className="text-background/70 text-base mb-8 leading-relaxed">
              {t('weMove.cta.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/wemove/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black text-sm px-6 py-3.5 border-2 border-primary hover:bg-primary/90 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                {t('weMove.cta.btn')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-background font-bold text-sm px-6 py-3.5 border-2 border-background/20 hover:border-background/50 transition-colors">
                {t('weMove.cta.howBtn')}
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, key }, i) => (
              <div key={i} className="flex items-center gap-4 bg-background/5 border border-background/10 px-5 py-4 hover:bg-background/10 transition-colors rounded-xl">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-sm text-background/90">{t(key)}</span>
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
