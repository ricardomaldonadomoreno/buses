import { useTranslation } from 'react-i18next';
import { Search, Ticket, Bus, ThumbsUp } from 'lucide-react';

const STEPS = [
  { n: '01', icon: Search,   titleKey: 'weMove.how.s1.title', descKey: 'weMove.how.s1.desc', accent: 'bg-blue-500' },
  { n: '02', icon: Bus,      titleKey: 'weMove.how.s2.title', descKey: 'weMove.how.s2.desc', accent: 'bg-primary' },
  { n: '03', icon: Ticket,   titleKey: 'weMove.how.s3.title', descKey: 'weMove.how.s3.desc', accent: 'bg-green-500' },
  { n: '04', icon: ThumbsUp, titleKey: 'weMove.how.s4.title', descKey: 'weMove.how.s4.desc', accent: 'bg-yellow-500' },
];

const TRUST = [
  { emoji: '🪪', key: 'weMove.trust.id' },
  { emoji: '⭐', key: 'weMove.trust.rep' },
  { emoji: '🛡️', key: 'weMove.trust.safe' },
  { emoji: '📍', key: 'weMove.trust.trace' },
];

export function WeMoveHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="py-16 border-b-4 border-foreground bg-background">
      <div className="container max-w-5xl">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
            {t('weMove.how.eyebrow')}
          </p>
          <h2 className="text-3xl md:text-4xl font-black">{t('weMove.how.title')}</h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-0 mb-14">
          {/* Connector */}
          <div className="hidden md:block absolute top-9 left-[12.5%] w-3/4 h-0.5 bg-foreground/15 z-0" />

          {STEPS.map(({ n, icon: Icon, titleKey, descKey, accent }, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-4">
              <div className={`w-[72px] h-[72px] ${accent} border-4 border-foreground flex items-center justify-center mb-3 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground tracking-widest mb-1">{n}</span>
              <h3 className="font-black text-base mb-1">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
              {i < STEPS.length - 1 && (
                <div className="md:hidden text-xl text-muted-foreground mt-4">↓</div>
              )}
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x-2 divide-y-2 md:divide-y-0 divide-foreground/20 overflow-hidden">
          {TRUST.map(({ emoji, key }, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-5 px-4 bg-card text-center gap-1">
              <span className="text-3xl">{emoji}</span>
              <span className="text-xs font-bold text-foreground">{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
