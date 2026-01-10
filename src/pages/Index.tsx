import { useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SearchBox } from '@/components/landing/SearchBox';
import { ServiceButtons, ServiceType } from '@/components/landing/ServiceButtons';
import { ResultsPlaceholder } from '@/components/landing/ResultsPlaceholder';
import { AdvertisingBanner } from '@/components/landing/AdvertisingBanner';
import { NotificationsPanel } from '@/components/landing/NotificationsPanel';
import { useLandingData } from '@/hooks/useLandingData';

const Index = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [activeService, setActiveService] = useState<ServiceType>('packservice');
  const { notifications, ads, loading } = useLandingData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            <SearchBox
              origin={origin}
              destination={destination}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              service={activeService}
            />
            
            <ServiceButtons 
              activeService={activeService} 
              onServiceChange={setActiveService} 
            />
            
            <ResultsPlaceholder service={activeService} />
          </div>
          
          {/* Right Section */}
          <div className="space-y-6">
            <AdvertisingBanner ads={ads} loading={loading} />
            
            <NotificationsPanel notifications={notifications} loading={loading} />
          </div>
        </div>
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default Index;
