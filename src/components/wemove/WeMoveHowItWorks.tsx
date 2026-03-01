// src/components/wemove/WeMoveHowItWorks.tsx
import { Search, Ticket, Bus, ThumbsUp, ShieldCheck, Star, MapPin, Users } from 'lucide-react';

const STEPS = [
  { n: '01', icon: Search,   title: 'Busca tu ruta',        desc: 'Ingresa origen, destino y fecha para ver los transportes disponibles.',              color: 'bg-blue-500' },
  { n: '02', icon: Bus,      title: 'Elige tu unidad',      desc: 'Ve el tipo de vehículo, horario, asientos disponibles y precio por asiento.',       color: 'bg-primary' },
  { n: '03', icon: Ticket,   title: 'Reserva tu asiento',   desc: 'Confirma tu reserva directamente con el transportador por WhatsApp o la app.',      color: 'bg-green-500' },
  { n: '04', icon: ThumbsUp, title: 'Viaja y califica',     desc: 'Viaja con confianza y deja tu calificación para construir la comunidad.',           color: 'bg-amber-500' },
];

const TRUST = [
  { icon: ShieldCheck, label: 'Identidad verificada',  color: 'text-blue-400' },
  { icon: Star,        label: 'Reputación digital',    color: 'text-yellow-400' },
  { icon: ShieldCheck, label: 'Seguridad básica',      color: 'text-red-400' },
  { icon: MapPin,      label: 'Trazabilidad del viaje', color: 'text-green-400' },
];

export function WeMoveHowItWorks() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-5xl">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-3">¿Cómo funciona?</p>
          <h2 className="text-4xl md:text-5xl font-black text-foreground">Tu viaje en 4 pasos</h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 mb-16">
          {/* connector line */}
          <div className="hidden md:block absolute top-8 left-[14%] w-[72%] h-0.5 bg-gradient-to-r from-blue-500 via-primary via-green-500 to-amber-500 opacity-30 z-0" />

          {STEPS.map(({ n, icon: Icon, title, desc, color }, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-2 group">
              <div className={cn(color, 'w-16 h-16 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] group-hover:-translate-y-1 transition-all duration-200')}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground/60 tracking-widest mb-1">{n}</span>
              <h3 className="font-black text-base mb-2 text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-foreground/10 overflow-hidden rounded-2xl shadow-sm">
          {TRUST.map(({ icon: Icon, label, color }, i) => (
            <div key={i} className={cn(
              'flex flex-col items-center justify-center py-6 px-4 bg-muted/30 text-center gap-2 border-border/20',
              i < 3 ? 'border-r' : '',
            )}>
              <Icon className={cn('h-6 w-6', color)} />
              <span className="text-xs font-bold text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
