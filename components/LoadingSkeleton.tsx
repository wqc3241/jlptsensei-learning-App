import React from 'react';

export const ListSkeleton = () => (
  <div className="space-y-3 p-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-20 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center animate-pulse">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-2/3"></div>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
      </div>
    ))}
  </div>
);

export const DetailSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
    <div className="h-32 bg-slate-100 rounded-xl"></div>
    <div className="space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      <div className="h-20 bg-slate-100 rounded-lg"></div>
      <div className="h-20 bg-slate-100 rounded-lg"></div>
    </div>
  </div>
);
