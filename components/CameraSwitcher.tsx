'use client';

import React, { useState, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ActiveStream {
  deviceId: string;
  label: string;
  isActive: boolean;
}

const CameraSwitcher = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [isMultiView, setIsMultiView] = useState(false);
  
  const call = useCall();

  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permission and enumerate devices
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        
        // Set initial camera if available
        if (videoDevices.length > 0 && call) {
          const stream = await call.camera.state.mediaStream;
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              const settings = videoTrack.getSettings();
              setActiveStreams([{
                deviceId: settings.deviceId || videoDevices[0].deviceId,
                label: videoDevices[0].label || 'Main Camera',
                isActive: true
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

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getCameras);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getCameras);
    };
  }, [call]);

  const handleCameraChange = async (deviceId: string) => {
    try {
      setLoading(true);
      if (!call) return;

      // If not in multi-view, switch the main camera
      if (!isMultiView) {
        await call.camera.disable();
        await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        });
        await call.camera.enable();
        
        // Update active streams
        setActiveStreams([{
          deviceId,
          label: cameras.find(cam => cam.deviceId === deviceId)?.label || 'Camera',
          isActive: true
        }]);
      } else {
        // In multi-view, add the camera to active streams if not already present
        if (!activeStreams.find(stream => stream.deviceId === deviceId)) {
          setActiveStreams(prev => [...prev, {
            deviceId,
            label: cameras.find(cam => cam.deviceId === deviceId)?.label || 'Camera',
            isActive: true
          }]);
        }
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeCamera = async (deviceId: string) => {
    setActiveStreams(prev => prev.filter(stream => stream.deviceId !== deviceId));
  };

  if (loading) {
    return (
      <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
          <Camera className="h-5 w-5 text-white" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
          <DropdownMenuItem
            onClick={() => setIsMultiView(!isMultiView)}
            className="flex items-center gap-2"
          >
            {isMultiView ? 'Single View' : 'Multi View'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="border-dark-1" />
          {cameras.map((camera) => (
            <DropdownMenuItem
              key={camera.deviceId}
              onClick={() => handleCameraChange(camera.deviceId)}
              className={
                activeStreams.some(stream => stream.deviceId === camera.deviceId)
                  ? "bg-[#4c535b]"
                  : ""
              }
            >
              {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isMultiView && activeStreams.length > 0 && (
        <div className="absolute top-full left-0 mt-4 w-screen max-w-3xl bg-dark-2 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            {activeStreams.map((stream) => (
              <div 
                key={stream.deviceId} 
                className="relative bg-dark-3 rounded-lg p-2 aspect-video"
              >
                <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-sm">
                  {stream.label}
                </div>
                <button
                  onClick={() => removeCamera(stream.deviceId)}
                  className="absolute top-2 right-2 z-10 bg-red-500/50 hover:bg-red-500 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* Stream view container */}
                <div className="h-full w-full bg-dark-4 rounded">
                  {/* Stream view will be rendered here by Stream SDK */}
                </div>
              </div>
            ))}
            {cameras.length > activeStreams.length && (
              <button
                onClick={() => {
                  const unusedCamera = cameras.find(
                    cam => !activeStreams.find(stream => stream.deviceId === cam.deviceId)
                  );
                  if (unusedCamera) {
                    handleCameraChange(unusedCamera.deviceId);
                  }
                }}
                className="flex items-center justify-center bg-dark-3 rounded-lg border-2 border-dashed border-gray-600 aspect-video"
              >
                <Plus className="h-8 w-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraSwitcher;