import React, { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Maximize2, MinusSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CameraStream {
  stream: MediaStream | null;
  label: string;
  isMaximized: boolean;
}

const DualCameraView = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryStream, setPrimaryStream] = useState<CameraStream>({ stream: null, label: 'Primary Camera', isMaximized: true });
  const [secondaryStream, setSecondaryStream] = useState<CameraStream>({ stream: null, label: 'Secondary Camera', isMaximized: false });
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        
        if (videoDevices.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: videoDevices[0].deviceId } }
          });
          setPrimaryStream({ stream, label: videoDevices[0].label, isMaximized: true });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error initializing cameras:', error);
        setLoading(false);
      }
    };

    initializeCameras();
    return () => {
      if (primaryStream.stream) primaryStream.stream.getTracks().forEach(track => track.stop());
      if (secondaryStream.stream) secondaryStream.stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (primaryVideoRef.current && primaryStream.stream) {
      primaryVideoRef.current.srcObject = primaryStream.stream;
    }
    if (secondaryVideoRef.current && secondaryStream.stream) {
      secondaryVideoRef.current.srcObject = secondaryStream.stream;
    }
  }, [primaryStream.stream, secondaryStream.stream]);

  const switchCamera = async (deviceId: string, label: string, isPrimary: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      
      if (isPrimary) {
        setPrimaryStream({ stream, label, isMaximized: primaryStream.isMaximized });
      } else {
        setSecondaryStream({ stream, label, isMaximized: secondaryStream.isMaximized });
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const toggleMaximize = (isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryStream({ ...primaryStream, isMaximized: !primaryStream.isMaximized });
    } else {
      setSecondaryStream({ ...secondaryStream, isMaximized: !secondaryStream.isMaximized });
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
      <div className="fixed bottom-24 right-4 flex flex-col gap-4">
        <div className="relative aspect-video w-96 overflow-hidden rounded-lg bg-dark-2">
          {/* Primary Camera */}
          <div className={`absolute transition-all duration-300 ${
            primaryStream.isMaximized ? "inset-0" : "bottom-4 right-4 h-32 w-48 rounded-lg shadow-lg"
          }`}>
            <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50">
                  <Camera className="h-4 w-4 text-white" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-dark-2 text-white">
                  {cameras.map((camera) => (
                    <DropdownMenuItem
                      key={camera.deviceId}
                      onClick={() => switchCamera(camera.deviceId, camera.label, true)}
                    >
                      {camera.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => toggleMaximize(true)}
                className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50"
              >
                {primaryStream.isMaximized ? <MinusSquare className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
              </button>
            </div>
            <video
              ref={primaryVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>

          {/* Secondary Camera */}
          {secondaryStream.stream && (
            <div className={`absolute transition-all duration-300 ${
              secondaryStream.isMaximized ? "inset-0 z-10" : "bottom-4 right-4 h-32 w-48 rounded-lg shadow-lg"
            }`}>
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50">
                    <Camera className="h-4 w-4 text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-dark-2 text-white">
                    {cameras.map((camera) => (
                      <DropdownMenuItem
                        key={camera.deviceId}
                        onClick={() => switchCamera(camera.deviceId, camera.label, false)}
                      >
                        {camera.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  onClick={() => toggleMaximize(false)}
                  className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50"
                >
                  {secondaryStream.isMaximized ? <MinusSquare className="h-4 w-4 text-white" /> : <Maximize2 className="h-4 w-4 text-white" />}
                </button>
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
        </div>
      </div>
    </div>
  );
};

export default DualCameraView;