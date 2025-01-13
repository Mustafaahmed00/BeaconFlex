'use client';

import { useEffect, useState } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';
import Alert from './Alert';
import { Button } from './ui/button';
import { Input } from './ui/input';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const { user } = useUser();
  const call = useCall();
  const [username, setUsername] = useState('');
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  useEffect(() => {
    // Try to get saved username from localStorage
    const savedUsername = localStorage.getItem('meetingUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    } else if (user?.username) {
      // Use Clerk username as fallback
      setUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

    const handleJoinMeeting = async () => {
      if (!username.trim()) return;
    
      try {
        localStorage.setItem('meetingUsername', username);
        
        // Add this line
        await call.update({
          custom: {
            displayName: username
          }
        });
        
        await call.join();
        setIsSetupComplete(true);
      } catch (error) {
        console.error('Error joining meeting:', error);
      }
    };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>
      
      <VideoPreview />
      
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="w-full space-y-2">
          <label className="text-sm font-medium text-gray-200">
            Display Name
          </label>
          <Input
            placeholder="Enter your display name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-dark-4 border-dark-4 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="flex h-16 items-center justify-center gap-3">
          <label className="flex items-center justify-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={isMicCamToggled}
              onChange={(e) => setIsMicCamToggled(e.target.checked)}
            />
            Join with mic and camera off
          </label>
          <DeviceSettings />
        </div>
      </div>

      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={handleJoinMeeting}
        disabled={!username.trim()}
      >
        Join meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;