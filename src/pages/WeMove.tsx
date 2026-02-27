import { useState, useRef } from 'react';
import { WeMoveHeader } from '@/components/wemove/WeMoveHeader';
import { WeMoveHeroSearch } from '@/components/wemove/WeMoveHeroSearch';
import { WeMoveResults } from '@/components/wemove/WeMoveResults';
import { WeMoveHowItWorks } from '@/components/wemove/WeMoveHowItWorks';
import { WeMoveCTA } from '@/components/wemove/WeMoveCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { useWeMoveRoutes } from '@/hooks/useWeMoveData';

const WeMove = () => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useState<{
    origin: string;
    destination: string;
    date?: Date;
  }>({ origin: '', destination: '' });
  const [hasSearched, setHasSearched] = useState(false);

  const { data: routes, isLoading } = useWeMoveRoutes(
    searchParams.origin || undefined,
    searchParams.destination || undefined,
    searchParams.date
  );

  const handleSearch = (origin: string, destination: string, date?: Date) => {
    setSearchParams({ origin, destination, date });
    setHasSearched(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WeMoveHeader />
      <main className="flex-1">
        <WeMoveHeroSearch onSearch={handleSearch} />
        <div ref={resultsRef}>
          <WeMoveResults routes={routes} isLoading={isLoading} hasSearched={hasSearched} />
        </div>
        {!hasSearched && <WeMoveHowItWorks />}
        <WeMoveCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default WeMove;
