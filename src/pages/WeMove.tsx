import { useState, useRef } from 'react';
import { WeMoveHeader } from '@/components/wemove/WeMoveHeader';
import { WeMoveHero } from '@/components/wemove/WeMoveHero';
import { WeMoveSearch } from '@/components/wemove/WeMoveSearch';
import { WeMoveResults } from '@/components/wemove/WeMoveResults';
import { WhyWeMove } from '@/components/wemove/WhyWeMove';
import { WeMoveCTA } from '@/components/wemove/WeMoveCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { useWeMoveRoutes } from '@/hooks/useWeMoveData';

const WeMove = () => {
  const searchRef = useRef<HTMLDivElement>(null);
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

  const handleSearchClick = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = (origin: string, destination: string, date?: Date) => {
    setSearchParams({ origin, destination, date });
    setHasSearched(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WeMoveHeader />
      <main className="flex-1">
        <WeMoveHero onSearchClick={handleSearchClick} />
        <div ref={searchRef}>
          <WeMoveSearch onSearch={handleSearch} />
        </div>
        <WeMoveResults 
          routes={routes} 
          isLoading={isLoading} 
          hasSearched={hasSearched} 
        />
        <WhyWeMove />
        <WeMoveCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default WeMove;
