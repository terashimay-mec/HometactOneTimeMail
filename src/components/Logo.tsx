'use client';

import Image from 'next/image';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-8 w-auto", alt = "HOMETACT" }: LogoProps) {
  return (
    <Image 
      src="/ht_1l_color.webp" 
      alt={alt}
      width={200}
      height={50}
      className={className}
      priority
    />
  );
}
