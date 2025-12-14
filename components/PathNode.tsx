import React from 'react';
import { Lock, Star, Check } from 'lucide-react';
import { JLPTLevel, UnitStatus } from '../types';
import { LEVEL_COLORS } from '../constants';
import HankoStamp from './HankoStamp';

interface PathNodeProps {
  level: JLPTLevel;
  unitNumber: number;
  status: UnitStatus;
  onClick: () => void;
  loading?: boolean;
}

const PathNode: React.FC<PathNodeProps> = ({ level, unitNumber, status, onClick, loading }) => {
  const styles = LEVEL_COLORS[level];
  const isLeft = unitNumber % 2 === 1;
  const offsetClass = isLeft ? 'translate-x-[-20px]' : 'translate-x-[20px]';

  return (
    <div className={`flex justify-center py-4 relative ${offsetClass}`}>
      <div className="relative group">
        {/* Connection Line (visual only, handled by parent usually, but simple stub here) */}
        
        <button
          onClick={onClick}
          disabled={status === 'LOCKED' || loading}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center border-b-8 transition-all duration-200 active:border-b-0 active:translate-y-2 relative z-10
            ${status === 'LOCKED' 
              ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed' 
              : `${styles.accent} ${styles.border} text-white hover:brightness-110`
            }
            ${status === 'COMPLETED' ? 'bg-amber-400 border-amber-600' : ''}
          `}
        >
          {loading ? (
             <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'LOCKED' ? (
            <Lock className="w-8 h-8 opacity-50" />
          ) : status === 'COMPLETED' ? (
            <Check className="w-10 h-10 stroke-[4px]" />
          ) : (
            <Star className="w-10 h-10 fill-current" />
          )}
        </button>

        {/* Floating Label */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white shadow-sm border border-slate-100 ${status === 'LOCKED' ? 'text-slate-300' : 'text-slate-600'}`}>
            Unit {unitNumber}
          </span>
        </div>

        {/* Floating Stamp for completed */}
        {status === 'COMPLETED' && (
          <div className="absolute -top-4 -right-8 animate-in zoom-in duration-300">
            <HankoStamp level={level} size="sm" className="rotate-12 bg-white/80 backdrop-blur-sm shadow-sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PathNode;
