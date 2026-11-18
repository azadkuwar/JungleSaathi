import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg'; showText?: boolean }> = ({
  size = 'md',
  showText = true
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center">
        {/* Outer shield glow */}
        <div className="absolute inset-0 rounded-xl bg-forest-accent/20 blur-sm"></div>
        
        {/* Custom SVG combining Shield + Leaf + Forest Pine + Wildlife emblem */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative transition-transform duration-300 hover:scale-105"
        >
          {/* Shield Base */}
          <path
            d="M24 4L7 11V23.5C7 33.5 14.5 41.5 24 44C33.5 41.5 41 33.5 41 23.5V11L24 4Z"
            fill="#123B2A"
            stroke="#34D399"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Leaf & Forest Canopy Silhouette */}
          <path
            d="M24 10C24 10 16 17 16 26C16 30.5 19.5 34 24 34C28.5 34 32 30.5 32 26C32 17 24 10 24 10Z"
            fill="#1D5B40"
            stroke="#34D399"
            strokeWidth="1.5"
          />

          {/* Forest Pine Tree Center Stem */}
          <path
            d="M24 16L24 33"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Leaf Veins / Tree Branches */}
          <path
            d="M24 21L20 18M24 25L19 23M24 29L20 28M24 21L28 18M24 25L29 23M24 29L28 28"
            stroke="#6EE7B7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Small Wildlife Emblem / Glowing Sentry Dot */}
          <circle cx="24" cy="12" r="2" fill="#F59E0B" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-white text-lg font-sans">
              JUNGLE
            </span>
            <span className="font-black tracking-wider text-forest-accent text-lg font-sans">
              SAATHI
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-forest-secondary text-forest-accent border border-forest-border">
              AI+IoT
            </span>
          </div>
          <span className="text-[10px] tracking-wide text-forest-muted -mt-1 font-medium">
            Smart Forest Protection System
          </span>
        </div>
      )}
    </div>
  );
};

