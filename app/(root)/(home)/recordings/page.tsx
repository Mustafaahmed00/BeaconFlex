'use client';

import CallList from '@/components/CallList';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState, useCallback } from 'react';

const RecordingsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recordings</h1>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>
      <CallList type="recordings" key={refreshKey} />
    </section>
  );
};

export default RecordingsPage;