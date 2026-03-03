// src/components/wemove/WeMoveFleet.tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const VEHICLES = [
  { key: 'car',        emoji: '🚗' },
  { key: 'van',        emoji: '🚐' },
  { key: 'bus',        emoji: '🚌' },
  { key: 'motorcycle', emoji: '🏍️' },
  { key: 'boat',       emoji: '⛵' },
  { key: 'plane',      emoji: '🛩️' },
  { key: 'helicopter', emoji: '🚁' },
  { key: 'drone',      emoji: '🚀' },
  { key: 'balloon',    emoji: '🎈' },
  { key: 'rv',         emoji: '🚎' },
  { key: 'truck',      emoji: '🚛' },
  { key: 'anything',   emoji: '✨' },
];

export function WeMoveFleet() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-foreground text-background overflow-hidden">
      <div className="container max-w-5xl">

        {/* Eyebrow */}
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-4 text-center">
          {t('weMove.fleet.eyebrow')}
        </p>

        {/* Título principal */}
        <h2 className="text-4xl md:text-6xl font-black text-center leading-tight mb-4">
          {t('weMove.fleet.title')}{' '}
          <span className="text-primary">{t('weMove.fleet.titleAccent')}</span>
        </h2>

        {/* Subtítulo */}
        <p className="text-center text-background/60 text-lg font-medium mb-14 max-w-xl mx-auto">
          {t('weMove.fleet.subtitle')}
        </p>

        {/* Grid de vehículos */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-14">
          {VEHICLES.map(({ key, emoji }) => (
            <div
              key={key}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-background/10 hover:border-primary/60 hover:bg-background/5 transition-all duration-200 cursor-default"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                {emoji}
              </span>
              <span className="text-xs font-bold text-background/70 group-hover:text-background text-center leading-tight">
                {t(`weMove.fleet.${key}`)}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline central */}
        <div className="text-center mb-10">
          <p className="text-2xl md:text-3xl font-black text-background/90 leading-snug">
            {t('weMove.fleet.tagline')}
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/wemove/register')}
            className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-black text-sm rounded-2xl hover:bg-primary/90 transition-all duration-200 hover:gap-5"
          >
            {t('weMove.hero.registerFree')}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

      </div>
    </section>
  );
}
