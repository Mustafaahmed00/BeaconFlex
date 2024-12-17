"use client";

import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

import { useGetCallById } from "@/hooks/useGetCallById";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const Table = ({
  title,
  description,
  isEditable = false,
  onSave,
}: {
  title: string;
  description: string;
  isEditable?: boolean;
  onSave?: (value: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);

  const handleSave = () => {
    if (onSave && editValue.trim()) {
      onSave(editValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-dark-4 border-dark-4 text-white h-8"
          />
          <button
            onClick={handleSave}
            className="text-green-500 hover:text-green-400"
          >
            <Check size={20} />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditValue(description);
            }}
            className="text-red-500 hover:text-red-400"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
            {description}
          </h1>
          {isEditable && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const defaultMeetingId = user?.id;
  const [meetingId, setMeetingId] = useState(defaultMeetingId);
  const [topic, setTopic] = useState(`${user?.username}'s Meeting Room`);

  useEffect(() => {
    // Load saved topic and meetingId from localStorage
    if (user?.id) {
      const savedTopic = localStorage.getItem(`meetingTopic_${user.id}`);
      const savedMeetingId = localStorage.getItem(`meetingId_${user.id}`);

      if (savedTopic) setTopic(savedTopic);
      if (savedMeetingId) setMeetingId(savedMeetingId);
    }
  }, [user?.id]);

  const { call } = useGetCallById(meetingId!);

  const startRoom = async () => {
    if (!client || !user) return;

    const newCall = client.call("default", meetingId!);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            topic: topic,
            creatorId: user.id
          }
        },
      });
    }

    router.push(`/meeting/${meetingId}?personal=true`);
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  const handleTopicSave = (newTopic: string) => {
    setTopic(newTopic);
    localStorage.setItem(`meetingTopic_${user?.id}`, newTopic);
    toast({
      title: "Topic updated successfully",
    });
  };

  const handleMeetingIdSave = (newId: string) => {
    setMeetingId(newId);
    localStorage.setItem(`meetingId_${user?.id}`, newId);
    toast({
      title: "Meeting ID updated successfully",
    });
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        <Table 
          title="Topic" 
          description={topic} 
          isEditable={true}
          onSave={handleTopicSave}
        />
        <Table 
          title="Meeting ID" 
          description={meetingId!}
          isEditable={true}
          onSave={handleMeetingIdSave}
        />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex gap-5">
        <Button className="bg-blue-1" onClick={startRoom}>
          Start Meeting
        </Button>
        <Button
          className="bg-dark-3"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: "Link Copied",
            });
          }}
        >
          Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;