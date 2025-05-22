import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true);

      try {
        // Fetch all calls
        const { calls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });

        setCalls(calls);
      } catch (error) {
        console.error('Failed to fetch calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id]);

  const now = new Date();

  // Filter ended calls
  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  // Filter upcoming calls
  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  // Fetch recordings for ended calls
  const callRecordings = endedCalls?.map((call) => call);

  return { endedCalls, upcomingCalls, callRecordings, isLoading };
};