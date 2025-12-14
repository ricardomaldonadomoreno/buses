import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Weight, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data - will be replaced with actual data from backend
const mockTrips = [
  {
    id: '1',
    origin: 'Madrid',
    destination: 'Barcelona',
    date: '2024-01-20',
    maxWeight: 50,
    usedWeight: 15,
    status: 'scheduled',
    transporter: 'Carlos M.',
  },
  {
    id: '2',
    origin: 'Valencia',
    destination: 'Sevilla',
    date: '2024-01-22',
    maxWeight: 30,
    usedWeight: 0,
    status: 'scheduled',
    transporter: 'Ana P.',
  },
  {
    id: '3',
    origin: 'Bilbao',
    destination: 'Madrid',
    date: '2024-01-25',
    maxWeight: 40,
    usedWeight: 25,
    status: 'in_progress',
    transporter: 'Miguel R.',
  },
];

const Trips = () => {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="border-2">{t('trips.scheduled')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary">{t('trips.inProgress')}</Badge>;
      case 'completed':
        return <Badge variant="secondary">{t('trips.completed')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">{t('trips.title')}</h1>
            <Button className="shadow-sm" asChild>
              <Link to="/trips/create">
                <Plus className="mr-2 h-4 w-4" />
                {t('trips.create')}
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {mockTrips.map((trip) => (
              <div
                key={trip.id}
                className="border-2 border-foreground bg-background p-6 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(trip.status)}
                      <span className="text-sm text-muted-foreground">
                        {trip.transporter}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <MapPin className="h-5 w-5" />
                      <span>{trip.origin}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{trip.destination}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(trip.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        <span>
                          {trip.maxWeight - trip.usedWeight} / {trip.maxWeight} kg {t('trips.availableWeight')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Weight progress bar */}
                    <div className="w-32 hidden sm:block">
                      <div className="h-2 border border-foreground bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(trip.usedWeight / trip.maxWeight) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <Button variant="outline" className="border-2" asChild>
                      <Link to={`/trips/${trip.id}`}>
                        {t('common.view')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mockTrips.length === 0 && (
            <div className="border-2 border-dashed border-foreground p-12 text-center">
              <p className="text-muted-foreground">{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trips;
