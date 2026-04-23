import React from 'react';

interface BastionLogoProps {
  className?: string;
  size?: number;
}

export const BastionLogo: React.FC<BastionLogoProps> = ({ className = "", size = 32 }) => {
  return (
    <div className={`relative flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-cyan-500/20 ${className}`} style={{ width: size, height: size }}>
      {/* Background with gradient and glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-cyan-950 opacity-90" />
      <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.1),transparent_70%)]" />
      
      {/* Stylized 'B' with circuitry look */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4/5 h-4/5 relative z-10"
      >
        {/* Background circuit grid */}
        <path d="M10 50 H90 M50 10 V90" stroke="currentColor" strokeWidth="0.1" className="text-cyan-500/10" />
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.1" className="text-cyan-500/10" />
        
        {/* Main 'B' structure with circuitry segments */}
        <g className="drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
          {/* Vertical spine */}
          <path
            d="M35 25 V75"
            stroke="url(#b-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Top curve/hexagon bit */}
          <path
            d="M35 25 L55 25 L65 35 L65 45 L55 55 L35 55"
            stroke="url(#b-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Bottom curve/hexagon bit */}
          <path
            d="M35 55 L55 55 L65 65 L65 75 L55 85 L35 85"
            stroke="url(#b-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        
        {/* Hexagonal decorative nodes (Cyan glowing) */}
        <g fill="#22d3ee" className="animate-pulse">
          {/* Top hexagon inside */}
          <path d="M50 35 L53 32 H57 L60 35 L57 38 H53 L50 35Z" />
          {/* Bottom hexagon inside */}
          <path d="M50 65 L53 62 H57 L60 65 L57 68 H53 L50 65Z" />
          
          {/* Outside nodes */}
          <circle cx="70" cy="35" r="2" />
          <circle cx="70" cy="75" r="2" />
          <circle cx="28" cy="40" r="2" />
          <circle cx="28" cy="70" r="2" />
        </g>
        
        {/* Connection lines */}
        <g stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6">
          <path d="M65 35 L70 35" />
          <path d="M65 75 L70 75" />
          <path d="M35 40 L28 40" />
          <path d="M35 70 L28 70" />
        </g>

        <defs>
          <linearGradient id="b-gradient" x1="30" y1="20" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#06b6d4" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full blur-[1px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full blur-[1px] animate-pulse delay-500" />
    </div>
  );
};

export default BastionLogo;
