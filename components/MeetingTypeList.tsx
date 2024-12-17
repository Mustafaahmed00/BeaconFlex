'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';

const RETENTION_PERIOD_DAYS = 120; // 4 months retention period

interface MeetingValues {
  dateTime: Date;
  description: string;
  link: string;
  courseId?: string;
  isRecordingEnabled: boolean;
  meetingType: 'lecture' | 'office_hours' | 'study_group' | 'other';
}

const initialValues: MeetingValues = {
  dateTime: new Date(),
  description: '',
  link: '',
  courseId: '',
  isRecordingEnabled: true,
  meetingType: 'lecture'
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>(undefined);
  const [values, setValues] = useState(initialValues);
  const [userCourses, setUserCourses] = useState<string[]>([]);
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  // Simulate fetching user's courses - replace with actual API call
  useEffect(() => {
    setUserCourses(['CS101', 'MATH201', 'PHYS301']);
  }, []);

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }

      const id = crypto.randomUUID();
      const call = client.call('default', id);
      
      if (!call) throw new Error('Failed to create meeting');
      
      const startsAt = values.dateTime.toISOString();
      
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description: values.description,
            courseId: values.courseId,
            meetingType: values.meetingType,
            creatorId: user.id,
            retentionDate: new Date(Date.now() + RETENTION_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString(),
            isRecordingEnabled: values.isRecordingEnabled
          },
        },
      });

      // Save meeting topic to localStorage for future reference
      if (values.description) {
        localStorage.setItem(`meetingTopic_${user.id}`, values.description);
      }

      router.push(`/meeting/${call.id}`);
      toast({ title: 'Meeting Created Successfully' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  const meetingTypes = [
    { id: 'lecture', label: 'Lecture', icon: '📚' },
    { id: 'office_hours', label: 'Office Hours', icon: '👥' },
    { id: 'study_group', label: 'Study Group', icon: '👨‍👨‍👦' },
    { id: 'other', label: 'Other', icon: '📝' }
  ];

  if (!client || !user) return <Loader />;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="Quick Lecture"
        description="Start an instant lecture recording"
        handleClick={() => {
          setValues({ ...initialValues, meetingType: 'lecture' });
          setMeetingState('isInstantMeeting');
        }}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Class"
        description="Enter via invitation link"
        className="bg-blue-1"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Class"
        description="Plan your lectures & office hours"
        className="bg-purple-1"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="Class Recordings"
        description="Access Past Lectures"
        className="bg-yellow-1"
        handleClick={() => router.push('/recordings')}
      />

      <MeetingModal
        isOpen={meetingState === 'isScheduleMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Schedule a Class"
        handleClick={createMeeting}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-base font-normal text-sky-2">Meeting Type</label>
            <div className="grid grid-cols-2 gap-2">
              {meetingTypes.map((type) => (
                <Button
                  key={type.id}
                  className={`flex items-center gap-2 ${
                    values.meetingType === type.id ? 'bg-blue-1' : 'bg-dark-3'
                  }`}
                  onClick={() => setValues({ ...values, meetingType: type.id as any })}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-normal text-sky-2">Course</label>
            <select 
              className="w-full rounded bg-dark-3 p-2"
              value={values.courseId}
              onChange={(e) => setValues({ ...values, courseId: e.target.value })}
            >
              <option value="">Select Course</option>
              {userCourses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-normal text-sky-2">Description</label>
            <Textarea
              placeholder="e.g., Week 3 Lecture - Introduction to Arrays"
              className="border-none bg-dark-3 focus-visible:ring-0"
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base font-normal text-sky-2">Date and Time</label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2"
              minDate={new Date()}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isRecordingEnabled}
              onChange={(e) => setValues({ ...values, isRecordingEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-sky-2">
              Enable Recording (auto-deleted after {RETENTION_PERIOD_DAYS} days)
            </label>
          </div>
        </div>
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Join Class"
        buttonText="Join Now"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Paste meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start Quick Lecture"
        buttonText="Start Now"
        handleClick={createMeeting}
      />
    </section>
  );
};

export default MeetingTypeList;