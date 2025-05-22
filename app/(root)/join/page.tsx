// app/join/page.tsx

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import StreamVideoProvider from '@/providers/StreamClientProvider';
import { useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const MeetingPage = () => {
  const searchParams = useSearchParams();
  const callId = searchParams.get('call_id');
  const { isLoaded, user } = useUser();
  const { call, isCallLoading } = useGetCallById(callId || '');
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!isLoaded || isCallLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Loader className="animate-spin text-white" size={48} />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <p className="text-center text-3xl font-bold text-white">
          Call Not Found
        </p>
      </div>
    );
  }

  // Check if the user is allowed to join the call
  const notAllowed =
    call.type === 'invited' &&
    (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Alert title="You are not allowed to join this meeting" />
      </div>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-900">
      <StreamVideoProvider>
        <StreamCall call={call}>
          <StreamTheme>
            {!isSetupComplete ? (
              <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
            ) : (
              <MeetingRoom />
            )}
          </StreamTheme>
        </StreamCall>
      </StreamVideoProvider>
    </main>
  );
};

export default MeetingPage;
