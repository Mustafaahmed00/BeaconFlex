'use client';

import { useState, useEffect } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { AlertCircle, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RecordingControl = () => {
  const call = useCall();
  const { useIsCallRecordingInProgress } = useCallStateHooks();
  const isRecording = useIsCallRecordingInProgress();

  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  useEffect(() => {
    if (!call) return;

    const handleRecordingStarted = () => {
      setIsAwaitingResponse(false);
      toast({
        title: 'Recording Started',
        description: 'Your meeting is now being recorded',
        duration: 4000,
      });
    };

    const handleRecordingStopped = () => {
      setIsAwaitingResponse(false);
      toast({
        title: 'Recording Stopped',
        description: 'Your recording has been saved and will appear in recordings shortly',
        duration: 4000,
      });
    };

    call.on('call.recording_started', handleRecordingStarted);
    call.on('call.recording_stopped', handleRecordingStopped);

    return () => {
      call.off('call.recording_started', handleRecordingStarted);
      call.off('call.recording_stopped', handleRecordingStopped);
    };
  }, [call]);

  const startRecording = async () => {
    if (!call) {
      toast({
        title: 'Error',
        description: 'Call not initialized',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAwaitingResponse(true);
      await call.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Recording Failed',
        description: 'Failed to start recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async () => {
    if (!call) return;

    const confirmStop = window.confirm('Are you sure you want to stop the recording?');
    if (!confirmStop) return;

    try {
      setIsAwaitingResponse(true);
      await call.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!call || isAwaitingResponse}
        className={`cursor-pointer rounded-2xl px-4 py-2 flex items-center gap-2 ${
          !call || isAwaitingResponse
            ? 'opacity-50 cursor-not-allowed bg-gray-500'
            : isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-[#19232d] hover:bg-[#4c535b]'
        }`}
      >
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="animate-pulse">
              <AlertCircle size={16} className="text-white" />
            </span>
          )}
          <Video size={20} className="text-white" />
          <span className="text-white text-sm">
            {isRecording ? 'Stop Recording' : 'Record'}
          </span>
        </div>
      </button>

      {isRecording && (
        <div className="rounded-full bg-red-500 w-2 h-2 animate-pulse" />
      )}
    </div>
  );
};

export default RecordingControl;