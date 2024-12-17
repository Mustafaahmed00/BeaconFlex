'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  return (
    <section
      className={cn(
        'flex min-h-[200px] w-full cursor-pointer flex-col justify-between rounded-xl bg-orange-1 p-6',
        'transition-all hover:-translate-y-1 hover:shadow-lg',
        className
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-center glassmorphism size-12 rounded-[10px]">
        <Image src={img} alt={title} width={27} height={27} />
      </div>
      
      {/* Content */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-lg font-normal text-white/90">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;