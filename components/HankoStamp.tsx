import React from 'react';
import { JLPTLevel } from '../types';
import { LEVEL_COLORS } from '../constants';

interface HankoStampProps {
  level: JLPTLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const HankoStamp: React.FC<HankoStampProps> = ({ level, className = "", size = 'md' }) => {
  const colors = LEVEL_COLORS[level];
  const colorClass = colors.text;
  
  const sizeClasses = {
    sm: "w-10 h-10 text-xs border-2",
    md: "w-16 h-16 text-lg border-[3px]",
    lg: "w-24 h-24 text-2xl border-[4px]"
  };

  return (
    <div 
      className={`hanko-stamp flex flex-col items-center justify-center font-bold tracking-tighter ${colorClass} ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: "'Noto Serif JP', serif" }} // Serif looks more like a stamp
    >
      <span className="leading-none text-[0.6em]">JLPT</span>
      <span className="leading-none">{level}</span>
      <span className="leading-none text-[0.5em] mt-[2px]">合格</span>
    </div>
  );
};

export default HankoStamp;
