// src/components/wemove/WeMoveCTA.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, Bus, TrendingUp, Smartphone, Users, CheckCircle } from 'lucide-react';

const PERKS = [
  { icon: Bus,        text: 'Publica viajes en minutos, sin papeleos' },
  { icon: TrendingUp, text: 'Gestiona reservas y pasajeros en tiempo real' },
  { icon: Smartphone, text: 'Grupo de viaje automático' },
  { icon: Users,      text: 'Construye tu reputación en la comunidad' },
];

export function WeMoveCTA() {
  return (
    <section className="bg-foreground text-background py-20">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-4">
              UNETE AHORA!
            </p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-background">
              Transporta, GANA<br />y crece sin ser<br />
              <span className="text-primary">una empresa</span>
            </h2>
            <p className="text-background/60 text-base mb-8 leading-relaxed">
              WeMove es la plataforma para personas reales que quieren transportar personas. Sin intermediarios, con identidad verificada y reputación digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/wemove/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black text-sm px-6 py-3.5 border-2 border-primary hover:bg-primary/90 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                Únete gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/wemove"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-background font-bold text-sm px-6 py-3.5 border-2 border-background/20 hover:border-background/50 transition-colors">
                Ver cómo funciona
              </Link>
            </div>
          </div>

          {/* Right: perks */}
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 bg-background/5 border border-background/10 px-5 py-4 hover:bg-background/10 transition-colors rounded-xl">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-sm text-background/90">{text}</span>
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
