import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Star, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WeMoveRoute } from '@/hooks/useWeMoveData';

interface WeMoveResultsProps {
  routes: WeMoveRoute[] | undefined;
  isLoading: boolean;
  hasSearched: boolean;
}

export function WeMoveResults({ routes, isLoading, hasSearched }: WeMoveResultsProps) {
  const { t } = useTranslation();

  if (!hasSearched) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h2 className="text-3xl font-black mb-8 text-foreground">
          {t('weMove.resultsTitle')}
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : routes && routes.length > 0 ? (
          <div className="space-y-4">
            {routes.map((route) => (
              <Card 
                key={route.id}
                className="border-4 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">
                          {route.transporter?.full_name || 'Transportador'}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">
                            {route.transporter?.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-foreground">
                        <span className="font-medium">{route.route?.origin?.name || 'Origen'}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">{route.route?.destination?.name || 'Destino'}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
                        <span>{format(new Date(route.departure_time), 'PPP p')}</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{route.available_seats} {t('weMove.availableSeats')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary">
                          ${route.price.toFixed(2)}
                        </span>
                      </div>
                      <Button className="border-2 border-foreground">
                        {t('common.viewDetails')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-4 border-foreground">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                {t('weMove.noRoutesFound')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
