'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';

const BATCH_SIZE = 3; // Process 3 calls at a time
const DELAY_MS = 1000; // Wait 1 second between batches

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [fetchingRecordings, setFetchingRecordings] = useState(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processBatch = async (calls: Call[], startIdx: number) => {
    const batch = calls.slice(startIdx, startIdx + BATCH_SIZE);
    if (batch.length === 0) return [];

    const batchResults = await Promise.all(
      batch.map(async (call) => {
        try {
          return await call.queryRecordings();
        } catch (err) {
          console.warn(`Failed to fetch recordings for call ${call.id}:`, err);
          return { recordings: [] };
        }
      })
    );
    return batchResults;
  };

  const fetchRecordings = async () => {
    if (!callRecordings?.length) return;
    setFetchingRecordings(true);

    try {
      const allRecordings: CallRecording[] = [];

      for (let i = 0; i < callRecordings.length; i += BATCH_SIZE) {
        const batchResults = await processBatch(callRecordings, i);
        
        const batchRecordings = batchResults
          .filter(result => result.recordings?.length > 0)
          .flatMap(result => result.recordings);
        
        allRecordings.push(...batchRecordings);

        if (i + BATCH_SIZE < callRecordings.length) {
          await delay(DELAY_MS);
        }
      }

      setRecordings(allRecordings);
    } catch (err) {
      console.error('Error fetching recordings:', err);
    } finally {
      setFetchingRecordings(false);
    }
  };

  const getCalls = () => {
    switch (type) {
      case 'ended': return endedCalls;
      case 'recordings': return recordings;
      case 'upcoming': return upcomingCalls;
      default: return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended': return 'No Previous Calls';
      case 'upcoming': return 'No Upcoming Calls';
      case 'recordings': return 'No Recordings';
      default: return '';
    }
  };

  useEffect(() => {
    if (type === 'recordings') {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading || fetchingRecordings) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => (
          <MeetingCard
            key={(meeting as Call).id || (meeting as CallRecording).filename}
            icon={type === 'ended' ? '/icons/previous.svg' : 
                  type === 'upcoming' ? '/icons/upcoming.svg' : 
                  '/icons/recordings.svg'}
            title={(meeting as Call).state?.custom?.description || 
                  (meeting as CallRecording).filename?.substring(0, 20) || 
                  'No Description'}
            date={(meeting as Call).state?.startsAt?.toLocaleString() ||
                 (meeting as CallRecording).start_time?.toLocaleString()}
            isPreviousMeeting={type === 'ended'}
            link={type === 'recordings' ? 
                 (meeting as CallRecording).url :
                 `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`}
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Play' : 'Start'}
            handleClick={type === 'recordings' ?
              () => router.push(`${(meeting as CallRecording).url}`) :
              () => router.push(`/meeting/${(meeting as Call).id}`)}
          />
        ))
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;