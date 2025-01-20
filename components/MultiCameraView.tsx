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
  const [activeViews, setActiveViews] = useState<CameraView[]>([]);
  const call = useCall();

  // Initialize cameras and first view
  useEffect(() => {
    const initializeCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        
        if (videoDevices.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: videoDevices[0].deviceId } }
          });
          
          setActiveViews([{
            id: '1',
            stream,
            deviceId: videoDevices[0].deviceId,
            label: videoDevices[0].label || 'Camera 1',
            isMaximized: false
          }]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error initializing cameras:', error);
        setLoading(false);
      }
    };

    initializeCameras();

    return () => {
      activeViews.forEach(view => {
        if (view.stream) {
          view.stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  // Add a new camera view
  const addCamera = async () => {
    if (activeViews.length >= 3) return;

    const usedDeviceIds = activeViews.map(v => v.deviceId);
    const availableCamera = cameras.find(cam => !usedDeviceIds.includes(cam.deviceId));

    if (availableCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: availableCamera.deviceId } }
        });

        const newView: CameraView = {
          id: (activeViews.length + 1).toString(),
          stream,
          deviceId: availableCamera.deviceId,
          label: availableCamera.label || `Camera ${activeViews.length + 1}`,
          isMaximized: false
        };

        setActiveViews(prev => [...prev, newView]);
      } catch (error) {
        console.error('Error adding camera:', error);
      }
    }
  };

  // Remove a camera view
  const removeCamera = (viewId: string) => {
    setActiveViews(prev => {
      const view = prev.find(v => v.id === viewId);
      if (view?.stream) {
        view.stream.getTracks().forEach(track => track.stop());
      }
      return prev.filter(v => v.id !== viewId);
    });
  };

  // Switch camera for a specific view
  const switchCamera = async (viewId: string, deviceId: string, label: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      setActiveViews(prev => prev.map(view => {
        if (view.id === viewId) {
          if (view.stream) {
            view.stream.getTracks().forEach(track => track.stop());
          }
          return {
            ...view,
            stream: newStream,
            deviceId,
            label: label || `Camera ${view.id}`
          };
        }
        return view;
      }));
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const toggleMaximize = (viewId: string) => {
    setActiveViews(prev => prev.map(view => ({
      ...view,
      isMaximized: view.id === viewId ? !view.isMaximized : false
    })));
  };

  if (loading) {
    return (
      <div className="flex-center rounded-lg bg-dark-3 p-2">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
    );
  }

  const getViewSize = (view: CameraView) => {
    const isAnyMaximized = activeViews.some(v => v.isMaximized);
    
    if (view.isMaximized) {
      return "w-[640px] h-[360px]";
    }
    
    if (isAnyMaximized) {
      return "w-[160px] h-[90px]";
    }
    
    switch (activeViews.length) {
      case 1:
        return "w-[640px] h-[360px]";
      case 2:
        return "w-[320px] h-[180px]";
      case 3:
        return "w-[320px] h-[180px]";
      default:
        return "w-[640px] h-[360px]";
    }
  };

  return (
    <div className="fixed bottom-24 right-4">
      <div className={`flex gap-2 flex-wrap justify-end items-end max-w-[1280px]`}>
        {activeViews.map((view) => (
          <div 
            key={view.id}
            className={`relative transition-all duration-300 rounded-lg overflow-hidden ${getViewSize(view)}`}
            style={{ 
              zIndex: view.isMaximized ? 20 : 10,
            }}
          >
            <div className="absolute left-2 top-2 z-30 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50">
                  <Camera className="h-4 w-4 text-white" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-dark-2 text-white">
                  {cameras.map((camera) => (
                    <DropdownMenuItem
                      key={camera.deviceId}
                      onClick={() => switchCamera(view.id, camera.deviceId, camera.label)}
                    >
                      {camera.label || `Camera ${view.id}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => toggleMaximize(view.id)}
                className="rounded-lg bg-dark-3/50 p-2 hover:bg-dark-4/50"
              >
                {view.isMaximized ? 
                  <MinusSquare className="h-4 w-4 text-white" /> : 
                  <Maximize2 className="h-4 w-4 text-white" />
                }
              </button>
              {activeViews.length > 1 && (
                <button
                  onClick={() => removeCamera(view.id)}
                  className="rounded-lg bg-red-500/50 p-2 hover:bg-red-600/50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
            <video
              autoPlay
              playsInline
              muted
              ref={(element) => {
                if (element && view.stream) {
                  element.srcObject = view.stream;
                }
              }}
              className="h-full w-full object-cover bg-dark-2"
            />
          </div>
        ))}
        
        {/* Add Camera Button */}
        {activeViews.length < 3 && cameras.length > activeViews.length && (
          <button
            onClick={addCamera}
            className="rounded-lg bg-dark-3 p-2 hover:bg-dark-4 transition-colors"
          >
            <Plus className="h-6 w-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiCameraView;