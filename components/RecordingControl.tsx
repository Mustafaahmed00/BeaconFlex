'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { AlertCircle, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RecordingControl = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const call = useCall();

  useEffect(() => {
    setAudioContext(new AudioContext());

    const checkRecordingStatus = async () => {
      if (!call) return;
      try {
        const recordings = await call.queryRecordings();
        const currentRecordings = Array.isArray(recordings) ? recordings : recordings?.recordings || [];
        const hasActiveRecording = currentRecordings.length > 0;
        setIsRecording(hasActiveRecording);
      } catch (error) {
        console.error('Error checking recording status:', error);
      }
    };

    checkRecordingStatus();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [call]);

  const playNotificationSound = useCallback((frequency: number, duration: number) => {
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, duration);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [audioContext]);

  const startRecording = async () => {
    if (!call) {
      toast({
        title: "Error",
        description: "Call not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      await call.startRecording();
      setIsRecording(true);
      
      playNotificationSound(880, 200);
      document.title = "🔴 " + document.title;
      
      toast({
        title: "Recording Started",
        description: "Your meeting is now being recorded",
        duration: 4000,
      });

      const speech = new SpeechSynthesisUtterance("Recording started");
      speech.volume = 0.5;
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!call) return;

    try {
      await call.stopRecording();
      setIsRecording(false);
      
      playNotificationSound(440, 200);
      document.title = document.title.replace("🔴 ", "");
      
      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved and will appear in recordings shortly",
        duration: 4000,
      });

      const speech = new SpeechSynthesisUtterance("Recording stopped");
      speech.volume = 0.5;
      window.speechSynthesis.speak(speech);

      if (call.id && call.state?.custom?.topic) {
        localStorage.setItem(`meetingTopic_${call.id}`, call.state.custom.topic);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!call}
        className={`cursor-pointer rounded-2xl px-4 py-2 flex items-center gap-2 ${
          !call 
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