import React, { useState } from 'react';
import { ChevronLeft, Gamepad2, Library, Dumbbell } from 'lucide-react';
import { JLPTLevel, UnitContent, UnitStatus } from './types';
import { LEVELS, LEVEL_COLORS, TOTAL_UNITS_PER_LEVEL } from './constants';
import * as GeminiService from './services/geminiService';
import HankoStamp from './components/HankoStamp';
import PathNode from './components/PathNode';
import LessonView from './components/LessonView';
import ReferenceView from './components/ReferenceView';
import ExerciseView from './components/ExerciseView';

// --- Types ---
type GameViewState = 
  | { type: 'HOME' }
  | { type: 'LEVEL_PATH'; level: JLPTLevel }
  | { type: 'LESSON'; level: JLPTLevel; unit: UnitContent };

type MainTab = 'LEARN' | 'REFERENCE' | 'EXERCISE';

// Local Storage Helper
const getProgress = (): Record<JLPTLevel, number> => {
  const saved = localStorage.getItem('jlpt-progress');
  return saved ? JSON.parse(saved) : { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('LEARN');
  
  // Game State
  const [view, setView] = useState<GameViewState>({ type: 'HOME' });
  const [progress, setProgress] = useState<Record<JLPTLevel, number>>(getProgress());
  const [loadingUnit, setLoadingUnit] = useState<number | null>(null);

  // --- Handlers ---

  const handleLevelSelect = (level: JLPTLevel) => {
    setView({ type: 'LEVEL_PATH', level });
  };

  const handleUnitClick = async (level: JLPTLevel, unitNumber: number) => {
    setLoadingUnit(unitNumber);
    const content = await GeminiService.fetchUnitContent(level, unitNumber);
    setLoadingUnit(null);

    if (content) {
      setView({ type: 'LESSON', level, unit: content });
    }
  };

  const handleLessonComplete = (level: JLPTLevel, unitNumber: number) => {
    const currentMax = progress[level];
    if (unitNumber > currentMax) {
      const newProgress = { ...progress, [level]: unitNumber };
      setProgress(newProgress);
      localStorage.setItem('jlpt-progress', JSON.stringify(newProgress));
    }
    setView({ type: 'LEVEL_PATH', level });
  };

  // --- Renderers ---

  const renderGameHome = () => (
    <div className="p-6 space-y-8 max-w-md mx-auto pb-24">
      <header className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <span className="text-rose-500">日本語</span> Master
        </h1>
        <p className="text-slate-500 text-sm font-medium">Gamified JLPT Mastery</p>
      </header>

      <div className="grid gap-5">
        {[...LEVELS].reverse().map((level) => {
          const styles = LEVEL_COLORS[level];
          const completed = progress[level];
          const total = TOTAL_UNITS_PER_LEVEL;
          const percent = Math.round((completed / total) * 100);

          return (
            <button
              key={level}
              onClick={() => handleLevelSelect(level)}
              className={`group relative overflow-hidden rounded-2xl p-6 text-left shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${styles.bg} border ${styles.border}`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className={`text-3xl font-black ${styles.text}`}>{level}</h2>
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                       <div className={`h-full ${styles.accent}`} style={{ width: `${percent}%` }} />
                     </div>
                     <span className="text-xs font-bold text-slate-400">{completed}/{total} Units</span>
                  </div>
                </div>
                <HankoStamp level={level} className="transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderLevelPath = (level: JLPTLevel) => {
    const styles = LEVEL_COLORS[level];
    const completedCount = progress[level];
    
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <button 
              onClick={() => setView({ type: 'HOME' })}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className={`text-xl font-bold ${styles.text}`}>JLPT {level} Path</h1>
            <div className="w-10"></div>
          </div>
        </header>

        <div className="flex-1 max-w-md mx-auto w-full p-8 relative overflow-hidden">
           <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-slate-200 -translate-x-1/2 rounded-full" />
           <div className="space-y-8 py-8">
             {Array.from({ length: TOTAL_UNITS_PER_LEVEL }).map((_, idx) => {
               const unitNum = idx + 1;
               let status: UnitStatus = 'LOCKED';
               if (unitNum <= completedCount) status = 'COMPLETED';
               else if (unitNum === completedCount + 1) status = 'ACTIVE';

               return (
                 <PathNode
                   key={unitNum}
                   level={level}
                   unitNumber={unitNum}
                   status={status}
                   loading={loadingUnit === unitNum}
                   onClick={() => handleUnitClick(level, unitNum)}
                 />
               );
             })}
             
             <div className="flex justify-center pt-8 relative z-10">
               <div className={`w-32 h-32 rounded-3xl border-4 ${styles.border} bg-white flex flex-col items-center justify-center shadow-lg text-center p-4`}>
                  <HankoStamp level={level} size="lg" />
                  <span className="text-xs font-bold text-slate-400 mt-2">Level Complete!</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans">
      
      {/* Tab Content */}
      {activeTab === 'LEARN' ? (
        <>
          {view.type === 'HOME' && renderGameHome()}
          {view.type === 'LEVEL_PATH' && renderLevelPath(view.level)}
          {view.type === 'LESSON' && (
            <LessonView 
              level={view.level} 
              unit={view.unit} 
              onComplete={() => handleLessonComplete(view.level, parseInt(view.unit.id.split('-').pop() || '1'))}
              onExit={() => setView({ type: 'LEVEL_PATH', level: view.level })}
            />
          )}
        </>
      ) : activeTab === 'REFERENCE' ? (
        <ReferenceView />
      ) : (
        <ExerciseView />
      )}

      {/* Bottom Navigation */}
      {/* Hide nav if in active lesson to keep immersive feeling */}
      {view.type !== 'LESSON' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
          <div className="max-w-md mx-auto flex justify-around p-2">
            <button
              onClick={() => setActiveTab('LEARN')}
              className={`flex flex-col items-center p-2 rounded-xl w-20 transition-colors ${
                activeTab === 'LEARN' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Gamepad2 className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Game</span>
            </button>
            <button
              onClick={() => setActiveTab('EXERCISE')}
              className={`flex flex-col items-center p-2 rounded-xl w-20 transition-colors ${
                activeTab === 'EXERCISE' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Dumbbell className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Exercise</span>
            </button>
            <button
              onClick={() => setActiveTab('REFERENCE')}
              className={`flex flex-col items-center p-2 rounded-xl w-20 transition-colors ${
                activeTab === 'REFERENCE' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Library className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Library</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
