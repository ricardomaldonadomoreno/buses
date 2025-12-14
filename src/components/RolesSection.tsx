import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Package, Truck, User, ArrowRight } from 'lucide-react';

const roles = [
  { key: 'sender', icon: Package, link: '/trips' },
  { key: 'transporter', icon: Truck, link: '/trips/create' },
  { key: 'receiver', icon: User, link: '/transactions' },
];

export function RolesSection() {
  const { t } = useTranslation();

  return (
    <section className="border-b-2 border-foreground bg-accent">
      <div className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('landing.roles.title')}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.key}
                className="border-2 border-foreground bg-background p-8 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="space-y-6">
                  <div className="h-16 w-16 border-2 border-foreground bg-primary flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-2xl">
                    {t(`landing.roles.${role.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`landing.roles.${role.key}.description`)}
                  </p>
                  <Button variant="outline" className="border-2 group" asChild>
                    <Link to={role.link}>
                      {t('common.getStarted')}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
