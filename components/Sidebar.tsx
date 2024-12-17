'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <section 
      className={cn(
        "sticky left-0 top-0 flex h-screen flex-col justify-between bg-dark-1 text-white transition-all duration-300 ease-in-out max-sm:hidden",
        isCollapsed ? "w-[78px]" : "w-[264px]",
        "pt-28" // Maintain space for navbar
      )}
    >
      <div className="relative flex flex-1 flex-col gap-6 p-6">
        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-4 top-8 flex h-8 w-8 items-center justify-center rounded-full bg-blue-1 text-white shadow-lg transition-all hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {/* Navigation Links */}
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
          
          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex items-center gap-4 rounded-lg p-4 transition-all hover:bg-dark-2',
                {
                  'bg-blue-1': isActive,
                },
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                isCollapsed ? "w-6" : "w-6"
              )}>
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  width={24}
                  height={24}
                  className="transition-transform duration-200"
                />
              </div>
              
              {!isCollapsed && (
                <p className={cn(
                  "text-lg font-semibold transition-opacity duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                )}>
                  {item.label}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="pointer-events-none fixed left-[78px] top-1/2 z-50 hidden -translate-y-1/2 group-hover:block">
          <div className="rounded-md bg-dark-2 px-2 py-1 text-sm text-white shadow-lg">
            {sidebarLinks.find(item => pathname === item.route)?.label}
          </div>
        </div>
      )}
    </section>
  );
};

export default Sidebar;