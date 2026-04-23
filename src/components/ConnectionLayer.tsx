import React, { useMemo } from 'react';
import { AgentModule } from '../types';
import { cn } from '@/lib/utils';

interface ConnectionLayerProps {
  modules: AgentModule[];
  selectedModuleId?: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function ConnectionLayer({ modules, selectedModuleId, containerRef }: ConnectionLayerProps) {
  const connections = useMemo(() => {
    const lines: { id: string; from: string; to: string }[] = [];
    modules.forEach(module => {
      if (module.dependencies) {
        module.dependencies.forEach(depId => {
          lines.push({
            id: `${depId}-${module.id}`,
            from: depId,
            to: module.id
          });
        });
      }
    });
    return lines;
  }, [modules]);

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-0 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#fb923c" />
        </marker>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="lineGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
        </linearGradient>
      </defs>
      
      {connections.map(conn => (
        <ConnectionPath 
          key={conn.id} 
          fromId={conn.from} 
          toId={conn.to} 
          isActive={selectedModuleId === conn.from || selectedModuleId === conn.to}
          containerRef={containerRef} 
        />
      ))}
    </svg>
  );
}

function ConnectionPath({ 
  fromId, 
  toId, 
  isActive, 
  containerRef 
}: { 
  fromId: string; 
  toId: string; 
  isActive?: boolean;
  containerRef: React.RefObject<HTMLDivElement>; 
  key?: string 
}) {
  const [coords, setCoords] = React.useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  React.useEffect(() => {
    const updateCoords = () => {
      const fromEl = document.getElementById(`module-${fromId}`);
      const toEl = document.getElementById(`module-${toId}`);
      const container = containerRef.current;

      if (fromEl && toEl && container) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate connection points
        // In a vertical list, let's connect from center-left and curve out to the left
        const x1 = fromRect.left - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;

        setCoords({ x1, y1, x2, y2 });
      }
    };

    updateCoords();
    
    window.addEventListener('resize', updateCoords);
    const observer = new MutationObserver(updateCoords);
    if (containerRef.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', updateCoords);
      observer.disconnect();
    };
  }, [fromId, toId, containerRef]);

  if (!coords) return null;

  const { x1, y1, x2, y2 } = coords;
  const dy = Math.abs(y2 - y1);
  const curvature = Math.max(40, dy / 2);

  // Cubic bezier curve that bows out to the left
  const pathData = `M ${x1} ${y1} C ${x1 - curvature} ${y1}, ${x2 - curvature} ${y2}, ${x2} ${y2}`;

  return (
    <g className={cn("transition-all duration-300", isActive ? "opacity-100" : "opacity-40")}>
      <path
        d={pathData}
        fill="none"
        stroke={isActive ? "url(#lineGradientActive)" : "url(#lineGradient)"}
        strokeWidth={isActive ? "2.5" : "1.5"}
        strokeDasharray={isActive ? "none" : "5 3"}
        markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
        className={cn("transition-all duration-300", isActive ? "" : "animate-dash")}
      />
      <circle cx={x1} cy={y1} r={isActive ? "3.5" : "2.5"} fill="#f97316" />
      <circle cx={x2} cy={y2} r={isActive ? "3.5" : "2.5"} fill="#f97316" />
    </g>
  );
}
