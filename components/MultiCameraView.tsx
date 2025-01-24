import React, { useState, useEffect } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { Camera, Loader2, Maximize2, MinusSquare, Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CameraView {
  id: string;
  stream: MediaStream | null;
  deviceId: string;
  label: string;
  isMaximized: boolean;
}

const MultiCameraView = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<CameraView[]>([]);
  const call = useCall();

  // Initialize cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);

        if (videoDevices.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: videoDevices[0].deviceId } }
          });

          setViews([{
            id: '1',
            stream,
            deviceId: videoDevices[0].deviceId,
            label: videoDevices[0].label || 'Camera 1',
            isMaximized: false,
          }]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing cameras:', error);
        setLoading(false);
      }
    };

    getCameras();

    return () => {
      views.forEach(view => {
        if (view.stream) {
          view.stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  const addCamera = async () => {
    if (views.length >= 3) {
      console.log('Maximum of 3 cameras reached');
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Find an available camera (even if it's already in use)
      const availableCamera = videoDevices.find(camera => 
        !views.some(view => view.deviceId === camera.deviceId)
      );

      // If no unused camera is found, reuse the first camera
      const cameraToUse = availableCamera || videoDevices[0];

      if (!cameraToUse) {
        console.log('No cameras available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraToUse.deviceId } }
      });

      const newView: CameraView = {
        id: Date.now().toString(),
        stream,
        deviceId: cameraToUse.deviceId,
        label: cameraToUse.label || `Camera ${views.length + 1}`,
        isMaximized: false,
      };

      setViews(prev => [...prev, newView]);
    } catch (error) {
      console.error('Error adding camera:', error);
    }
  };

  const removeCamera = (viewId: string) => {
    setViews(prev => {
      const newViews = prev.filter(view => {
        if (view.id === viewId) {
          if (view.stream) {
            view.stream.getTracks().forEach(track => track.stop());
          }
          return false;
        }
        return true;
      });
      return newViews;
    });
  };

  const switchCamera = async (viewId: string, newDeviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: newDeviceId } }
      });

      setViews(prev => prev.map(view => {
        if (view.id === viewId) {
          if (view.stream) {
            view.stream.getTracks().forEach(track => track.stop());
          }

          const camera = cameras.find(c => c.deviceId === newDeviceId);

          return {
            ...view,
            stream,
            deviceId: newDeviceId,
            label: camera?.label || view.label
          };
        }
        return view;
      }));
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const toggleMaximize = (viewId: string) => {
    setViews(prev => prev.map(view =>
      view.id === viewId ? { ...view, isMaximized: !view.isMaximized } : view
    ));
  };

  if (loading) {
    return (
      <div className="flex-center rounded-lg bg-dark-3 p-2">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    );
  }

  const getSizeClasses = (isMaximized: boolean) => {
    return isMaximized ? 'w-[640px] h-[360px]' : 'w-[320px] h-[180px]';
  };

  const canAddMoreCameras = views.length < 3;

  return (
    <div className="fixed bottom-24 right-4">
      <div className="flex flex-col items-end gap-2">
        {/* Add Camera Button */}
        {canAddMoreCameras && (
          <button
            onClick={addCamera}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add Camera</span>
          </button>
        )}

        {/* Camera Views */}
        <div className="flex flex-wrap items-end justify-end gap-2">
          {views.map((view) => (
            <div
              key={view.id}
              className={`relative overflow-hidden rounded-lg ${getSizeClasses(view.isMaximized)}`}
            >
              {/* Control buttons */}
              <div className="absolute left-2 top-2 z-30 flex items-center gap-2">
                {/* Camera selector dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50">
                    <Camera className="h-4 w-4 text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-dark-2 text-white">
                    {cameras.map((camera) => (
                      <DropdownMenuItem
                        key={camera.deviceId}
                        onClick={() => switchCamera(view.id, camera.deviceId)}
                      >
                        {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Maximize/Minimize button */}
                <button
                  onClick={() => toggleMaximize(view.id)}
                  className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50"
                >
                  {view.isMaximized ? (
                    <MinusSquare className="h-4 w-4 text-white" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Remove camera button */}
                <button
                  onClick={() => removeCamera(view.id)}
                  className="rounded-lg bg-red-500/50 p-2 hover:bg-red-600/50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Video element */}
              {view.stream && (
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(element) => {
                    if (element) element.srcObject = view.stream;
                  }}
                  className="h-full w-full object-cover bg-dark-2"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiCameraView;