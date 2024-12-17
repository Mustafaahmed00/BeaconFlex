'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Add keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '\\') {
        setIsSidebarCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Check if we should show the layout
  const shouldShowLayout = !pathname.includes('/sign-in') && 
                         !pathname.includes('/sign-up') && 
                         !pathname.includes('/onboarding');

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-dark-2">
      <Navbar />
      
      <div className="flex">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)} 
        />
        
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'ml-[78px]' : 'ml-[264px]'
          } px-6 pb-6 pt-28 max-sm:ml-0`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}