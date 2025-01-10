import React, { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Maximize2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CameraStream {
  stream: MediaStream | null;
  label: string;
}

const DualCameraView = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryStream, setPrimaryStream] = useState<CameraStream>({ stream: null, label: 'Primary Camera' });
  const [secondaryStream, setSecondaryStream] = useState<CameraStream>({ stream: null, label: 'Secondary Camera' });
  const [isSecondaryLarge, setIsSecondaryLarge] = useState(false);
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeCameras = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPrimaryStream({ stream, label: 'Primary Camera' });
        if (primaryVideoRef.current) {
          primaryVideoRef.current.srcObject = stream;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing cameras:', error);
        setLoading(false);
      }
    };

    initializeCameras();

    return () => {
      if (primaryStream.stream) {
        primaryStream.stream.getTracks().forEach(track => track.stop());
      }
      if (secondaryStream.stream) {
        secondaryStream.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const switchCamera = async (deviceId: string, label: string) => {
    try {
      if (secondaryStream.stream) {
        secondaryStream.stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      
      setSecondaryStream({ stream, label });
      if (secondaryVideoRef.current) {
        secondaryVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const swapCameras = () => {
    if (!primaryStream.stream || !secondaryStream.stream) return;
    
    const tempStream = primaryStream;
    setPrimaryStream(secondaryStream);
    setSecondaryStream(tempStream);
    
    if (primaryVideoRef.current && secondaryVideoRef.current) {
      primaryVideoRef.current.srcObject = secondaryStream.stream;
      secondaryVideoRef.current.srcObject = tempStream.stream;
    }
  };

  if (loading) {
    return (
      <div className="flex-center rounded-lg bg-dark-3 p-2">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex-center rounded-lg bg-dark-3 p-2 hover:bg-dark-4">
          <Camera className="h-5 w-5 text-white" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-dark-2 text-white">
          {cameras.map((camera) => (
            <DropdownMenuItem
              key={camera.deviceId}
              onClick={() => switchCamera(camera.deviceId, camera.label)}
            >
              {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="fixed bottom-24 right-4 flex flex-col gap-4">
        <div className="relative aspect-video w-64 overflow-hidden rounded-lg bg-dark-2">
          {/* Primary Camera */}
          <video
            ref={primaryVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          
          {/* Secondary Camera */}
          {secondaryStream.stream && (
            <div className={`absolute transition-all duration-300 ${
              isSecondaryLarge 
                ? "inset-0 h-full w-full z-10" 
                : "bottom-4 right-4 h-24 w-32 rounded-lg shadow-lg"
            }`}>
              <div className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-1 text-sm">
                {secondaryStream.label}
              </div>
              <video
                ref={secondaryVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover rounded-lg"
              />
            </div>
          )}

          {secondaryStream.stream && (
            <>
              <button
                onClick={() => setIsSecondaryLarge(!isSecondaryLarge)}
                className="absolute right-2 top-2 z-20 rounded-full bg-dark-1/50 p-2 hover:bg-dark-1"
              >
                <Maximize2 className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={swapCameras}
                className="absolute right-2 top-12 z-20 rounded-full bg-dark-1/50 p-2 hover:bg-dark-1"
              >
                <svg 
                  className="h-4 w-4 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DualCameraView;