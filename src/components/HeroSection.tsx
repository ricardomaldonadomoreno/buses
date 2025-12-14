import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Truck } from 'lucide-react';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="container py-16 md:py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {t('landing.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg shadow-md hover:shadow-lg transition-shadow" asChild>
                <Link to="/trips/create">
                  <Truck className="mr-2 h-5 w-5" />
                  {t('landing.hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-2 shadow-sm hover:shadow-md transition-shadow" asChild>
                <Link to="/trips">
                  <Package className="mr-2 h-5 w-5" />
                  {t('landing.hero.ctaSecondary')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Decorative element */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto border-4 border-foreground bg-secondary shadow-xl p-8">
              <div className="h-full w-full border-2 border-dashed border-foreground flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-4">
                    <div className="h-16 w-16 border-2 border-foreground bg-primary flex items-center justify-center">
                      <Package className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="h-16 w-16 border-2 border-foreground bg-background flex items-center justify-center">
                      <ArrowRight className="h-8 w-8" />
                    </div>
                    <div className="h-16 w-16 border-2 border-foreground bg-primary flex items-center justify-center">
                      <Truck className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    VERIFIED • SECURE • TRACKED
                  </p>
                </div>
              </div>
            </div>
            {/* Decorative squares */}
            <div className="absolute -top-4 -left-4 h-8 w-8 border-2 border-foreground bg-accent" />
            <div className="absolute -bottom-4 -right-4 h-12 w-12 border-2 border-foreground bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
