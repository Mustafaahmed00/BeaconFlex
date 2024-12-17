'use client';

import { useState, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { AlertCircle, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RecordingControl = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const call = useCall();

  useEffect(() => {
    // Initialize AudioContext for notification sounds
    setAudioContext(new AudioContext());
  }, []);

  const playNotificationSound = (frequency: number, duration: number) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await call?.startRecording();
      
      // Play start notification sound (higher pitch)
      playNotificationSound(880, 200);

      toast({
        title: "Recording Started",
        description: "Your meeting is now being recorded",
        duration: 4000,
      });

      // Add recording indicator to the document title
      const originalTitle = document.title;
      document.title = "🔴 " + originalTitle;

      // Voice notification
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
    try {
      await call?.stopRecording();
      setIsRecording(false);

      // Play stop notification sound (lower pitch)
      playNotificationSound(440, 200);

      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved",
        duration: 4000,
      });

      // Restore original document title
      document.title = document.title.replace("🔴 ", "");

      // Voice notification
      const speech = new SpeechSynthesisUtterance("Recording stopped");
      speech.volume = 0.5;
      window.speechSynthesis.speak(speech);

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
        className={`cursor-pointer rounded-2xl px-4 py-2 flex items-center gap-2 ${
          isRecording 
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