import React, { useState, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { Camera, Loader2, Maximize2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface CameraStream {
  deviceId: string;
  label: string;
  isMainView: boolean;
}

const DualCameraView = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStreams, setActiveStreams] = useState<CameraStream[]>([]);
  const call = useCall();

  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        
        if (videoDevices.length > 0 && call) {
          const stream = await call.camera.state.mediaStream;
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              const settings = videoTrack.getSettings();
              setActiveStreams([{
                deviceId: settings.deviceId || videoDevices[0].deviceId,
                label: videoDevices[0].label || 'Main Camera',
                isMainView: true
              }]);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error getting cameras:', error);
        setLoading(false);
      }
    };

    getCameras();
    navigator.mediaDevices.addEventListener('devicechange', getCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getCameras);
    };
  }, [call]);

  const switchCamera = async (deviceId: string) => {
    try {
      if (!call || activeStreams.some(stream => stream.deviceId === deviceId)) return;
      
      setLoading(true);
      await call.camera.disable();
      await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      await call.camera.enable();

      setActiveStreams(prev => {
        if (prev.length === 0) {
          return [{
            deviceId,
            label: cameras.find(cam => cam.deviceId === deviceId)?.label || 'Camera',
            isMainView: true
          }];
        }
        return [...prev, {
          deviceId,
          label: cameras.find(cam => cam.deviceId === deviceId)?.label || 'Camera',
          isMainView: false
        }].slice(0, 2); // Limit to 2 cameras
      });
    } catch (error) {
      console.error('Error switching camera:', error);
    } finally {
      setLoading(false);
    }
  };

  const swapViews = () => {
    setActiveStreams(prev => prev.map(stream => ({
      ...stream,
      isMainView: !stream.isMainView
    })));
  };

  if (loading) {
    return (
      <div className="cursor-pointer rounded-2xl bg-dark-3 px-4 py-2">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-dark-3 px-4 py-2 hover:bg-dark-4">
          <Camera className="h-5 w-5 text-white" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-dark-2 text-white">
          {cameras.map((camera) => (
            <DropdownMenuItem
              key={camera.deviceId}
              onClick={() => switchCamera(camera.deviceId)}
              className={activeStreams.some(stream => stream.deviceId === camera.deviceId) 
                ? "bg-dark-4" 
                : ""}
            >
              {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeStreams.length === 2 && (
        <div className="fixed bottom-24 right-4 flex flex-col gap-4">
          <div className="relative w-64 aspect-video bg-dark-2 rounded-lg overflow-hidden">
            {activeStreams.map(stream => (
              <div
                key={stream.deviceId}
                className={`absolute inset-0 transition-all duration-300 ${
                  stream.isMainView 
                    ? "w-full h-full" 
                    : "w-32 h-24 bottom-4 right-4 shadow-lg rounded-lg"
                }`}
              >
                <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-sm">
                  {stream.label}
                </div>
                <div className="h-full w-full bg-dark-3 rounded" />
              </div>
            ))}
            <button
              onClick={swapViews}
              className="absolute top-2 right-2 z-20 bg-dark-1/50 p-2 rounded-full hover:bg-dark-1"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualCameraView;