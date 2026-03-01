// src/components/wemove/WeMoveHowItWorks.tsx
import { useTranslation } from 'react-i18next';
import { Search, Ticket, Bus, ThumbsUp, ShieldCheck, Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { n: '01', icon: Search,   titleKey: 'weMove.how.s1.title', descKey: 'weMove.how.s1.desc', color: 'bg-blue-500' },
  { n: '02', icon: Bus,      titleKey: 'weMove.how.s2.title', descKey: 'weMove.how.s2.desc', color: 'bg-primary' },
  { n: '03', icon: Ticket,   titleKey: 'weMove.how.s3.title', descKey: 'weMove.how.s3.desc', color: 'bg-green-500' },
  { n: '04', icon: ThumbsUp, titleKey: 'weMove.how.s4.title', descKey: 'weMove.how.s4.desc', color: 'bg-amber-500' },
];

const TRUST = [
  { icon: ShieldCheck, labelKey: 'weMove.trust.id',    color: 'text-blue-400' },
  { icon: Star,        labelKey: 'weMove.trust.rep',   color: 'text-yellow-400' },
  { icon: ShieldCheck, labelKey: 'weMove.trust.safe',  color: 'text-red-400' },
  { icon: MapPin,      labelKey: 'weMove.trust.trace', color: 'text-green-400' },
];

export function WeMoveHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-3">
            {t('weMove.how.eyebrow')}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-foreground">
            {t('weMove.how.title')}
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 mb-16">
          <div className="hidden md:block absolute top-8 left-[14%] w-[72%] h-0.5 bg-gradient-to-r from-blue-500 via-primary via-green-500 to-amber-500 opacity-30 z-0" />
          {STEPS.map(({ n, icon: Icon, titleKey, descKey, color }, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-2 group">
              <div className={cn(color, 'w-16 h-16 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] group-hover:-translate-y-1 transition-all duration-200')}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground/60 tracking-widest mb-1">{n}</span>
              <h3 className="font-black text-base mb-2 text-foreground">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border border-border/20 overflow-hidden rounded-2xl shadow-sm">
          {TRUST.map(({ icon: Icon, labelKey, color }, i) => (
            <div key={i} className={cn(
              'flex flex-col items-center justify-center py-6 px-4 bg-muted/30 text-center gap-2',
              i < 3 ? 'border-r border-border/20' : ''
            )}>
              <Icon className={cn('h-6 w-6', color)} />
              <span className="text-xs font-bold text-foreground">{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
