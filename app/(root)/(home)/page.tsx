'use client';

import { useEffect, useState } from 'react';
import MeetingTypeList from '@/components/MeetingTypeList';

interface ClassSession {
  id: string;
  subject: string;
  professorName: string;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'office_hours' | 'study_group';
}

const Home = () => {
  const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>([]);
  const [nextMeeting, setNextMeeting] = useState<ClassSession | null>(null);
  const now = new Date();
  
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now);

  useEffect(() => {
    const mockClasses: ClassSession[] = [
      {
        id: '1',
        subject: 'CS101 - Intro to Programming',
        professorName: 'Dr. Smith',
        startTime: '09:00 AM',
        endTime: '10:30 AM',
        type: 'lecture'
      },
      {
        id: '2',
        subject: 'MATH201 - Linear Algebra',
        professorName: 'Dr. Johnson',
        startTime: '02:00 PM',
        endTime: '03:30 PM',
        type: 'lecture'
      }
    ];

    setTodaysClasses(mockClasses);

    const currentTime = now.getTime();
    const nextClass = mockClasses.find(cls => {
      const classTime = new Date(`${now.toDateString()} ${cls.startTime}`).getTime();
      return classTime > currentTime;
    });

    setNextMeeting(nextClass || null);
  }, []);

  return (
    <div className="min-h-screen bg-dark-2">
      {/* Main content wrapper with no top padding */}
      <main className="flex size-full flex-col px-6">
        {/* Hero Section */}
        <section className="mb-6 w-full rounded-[20px] bg-hero bg-cover">
          <div className="flex h-[220px] flex-col justify-between rounded-[20px] p-6 lg:p-8">
            {/* Status Badge */}
            {nextMeeting ? (
              <div className="glassmorphism max-w-fit rounded-lg px-4 py-2">
                <p className="text-base font-medium text-white">
                  Next Class: {nextMeeting.startTime}
                </p>
              </div>
            ) : (
              <div className="glassmorphism max-w-fit rounded-lg px-4 py-2">
                <p className="text-base font-medium text-white">
                  No more classes today
                </p>
              </div>
            )}

            {/* Time and Date */}
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-bold text-white lg:text-7xl">{time}</h1>
              <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
            </div>
          </div>
        </section>

        {/* Today's Classes */}
        {todaysClasses.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Today's Classes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {todaysClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col gap-2 rounded-lg bg-dark-3 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {cls.subject}
                    </h3>
                    <span className="rounded-full bg-blue-1 px-3 py-1 text-sm">
                      {cls.type === 'lecture' ? '📚 Lecture' : '👥 Office Hours'}
                    </span>
                  </div>
                  <p className="text-sm text-sky-1">{cls.professorName}</p>
                  <div className="flex items-center justify-between text-sm text-sky-1">
                    <span>{cls.startTime}</span>
                    <span>-</span>
                    <span>{cls.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <MeetingTypeList />
      </main>
    </div>
  );
};

export default Home;