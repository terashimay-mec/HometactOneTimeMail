'use client';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-8 w-auto", alt = "HOMETACT" }: LogoProps) {
  return (
    <img 
      src="/ht_1l_color.webp" 
      alt={alt}
      className={className}
    />
  );
}
