import { useEffect, useState } from 'react';

interface CharacterAvatarProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
  accentHex?: string;
}

export function CharacterAvatar({
  src,
  alt,
  name,
  className = 'h-12 w-12 rounded-xl',
  accentHex = '#2563EB',
}: CharacterAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const initial = name.trim().slice(0, 1) || 'ক';
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          background: `linear-gradient(135deg, ${accentHex}18 0%, ${accentHex}33 100%)`,
          color: accentHex,
        }}
        className={`flex items-center justify-center border border-slate-200 font-editorial text-lg font-bold shrink-0 ${className}`}
      >
        <span aria-hidden="true">{initial}</span>
        <span className="sr-only">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover shrink-0 border border-slate-200/80 ${className}`}
    />
  );
}
