'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [error, setError] = useState('');
  const videoPreviewRef = useRef<HTMLDivElement>(null); // Ref for the video preview container

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

  // Update the username overlay dynamically
  useEffect(() => {
    const videoContainer = videoPreviewRef.current;
    if (videoContainer) {
      // Remove any existing username overlay
      const existingOverlay = videoContainer.querySelector('.username-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Add a new username overlay
      if (username) {
        const overlay = document.createElement('div');
        overlay.className =
          'username-overlay absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white flex items-center gap-2';
        overlay.innerHTML = `
          ${user?.imageUrl ? `<img src="${user.imageUrl}" alt="Profile" class="w-6 h-6 rounded-full" />` : ''}
          <span>${username}</span>
        `;
        videoContainer.appendChild(overlay);
      }
    }
  }, [username, user?.imageUrl]); // Update the overlay whenever the username or profile picture changes

  const handleJoinMeeting = async () => {
    if (!username.trim()) {
      setError('Please enter a valid username.');
      return;
    }

    try {
      // Save username to localStorage
      localStorage.setItem('meetingUsername', username);

      // Update the call with the custom display name
      await call.update({
        custom: {
          displayName: username,
        },
      });

      // Join the call
      await call.join();
      setIsSetupComplete(true);
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError('Failed to join the meeting. Please try again.');
    }
  };

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

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>

      {/* Video Preview with Username Overlay */}
      <div className="relative" ref={videoPreviewRef}>
        <VideoPreview />
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="w-full space-y-2">
          <label className="text-sm font-medium text-gray-200">
            Display Name
          </label>
          <Input
            placeholder="Enter your display name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(''); // Clear error when user types
            }}
            className="bg-dark-4 border-dark-4 text-white placeholder:text-gray-500"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
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