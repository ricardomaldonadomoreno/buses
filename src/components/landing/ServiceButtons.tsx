import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ServiceType = 'packservice' | 'wemove';

interface ServiceButtonsProps {
  activeService?: ServiceType;
  onServiceChange?: (service: ServiceType) => void;
}

export function ServiceButtons({ activeService, onServiceChange }: ServiceButtonsProps) {
  const { t } = useTranslation();

  const services = [
    {
      id: 'packservice' as ServiceType,
      icon: Package,
      title: t('landing.packService.title'),
      subtitle: t('landing.packService.subtitle'),
      href: '/packservice',
      accent: 'text-primary',
      activeBg: 'bg-primary',
      activeText: 'text-primary-foreground',
    },
    {
      id: 'wemove' as ServiceType,
      icon: Users,
      title: t('landing.weMove.title'),
      subtitle: t('landing.weMove.subtitle'),
      href: '/wemove',
      accent: 'text-foreground',
      activeBg: 'bg-foreground',
      activeText: 'text-background',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {services.map(({ id, icon: Icon, title, subtitle, href, activeBg, activeText }) => {
        const isActive = activeService === id;
        return (
          <Link
            key={id}
            to={href}
            onClick={() => onServiceChange?.(id)}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-5 text-center transition-all duration-200',
              'min-h-[100px] cursor-pointer',
              isActive
                ? cn(activeBg, activeText, 'shadow-md')
                : 'bg-card border border-border/60 hover:border-primary/40 hover:shadow-sm text-foreground'
            )}
          >
            <Icon className={cn(
              'h-6 w-6 transition-transform group-hover:scale-110',
              isActive ? 'opacity-90' : 'text-primary'
            )} />
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className={cn(
                'text-xs mt-0.5',
                isActive ? 'opacity-70' : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
