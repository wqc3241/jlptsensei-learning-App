import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  GraduationCap, 
  Search, 
  Menu, 
  Volume2, 
  RefreshCcw,
  Languages
} from 'lucide-react';

import { JLPTLevel, GrammarPoint, GrammarDetail, VocabularyItem, ContentType } from './types';
import { LEVELS, LEVEL_COLORS, LEVEL_DESCRIPTIONS } from './constants';
import * as GeminiService from './services/geminiService';
import HankoStamp from './components/HankoStamp';
import { ListSkeleton, DetailSkeleton } from './components/LoadingSkeleton';

// --- View State Types ---
type ViewState = 
  | { type: 'HOME' }
  | { type: 'LEVEL_LIST'; level: JLPTLevel; tab: ContentType }
  | { type: 'GRAMMAR_DETAIL'; level: JLPTLevel; point: GrammarPoint; detail?: GrammarDetail };

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>({ type: 'HOME' });
  const [grammarCache, setGrammarCache] = useState<Record<JLPTLevel, GrammarPoint[]>>({
    N5: [], N4: [], N3: [], N2: [], N1: []
  });
  const [vocabCache, setVocabCache] = useState<Record<JLPTLevel, VocabularyItem[]>>({
    N5: [], N4: [], N3: [], N2: [], N1: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- Handlers ---

  const handleLevelSelect = (level: JLPTLevel) => {
    setView({ type: 'LEVEL_LIST', level, tab: ContentType.GRAMMAR });
  };

  const loadGrammar = useCallback(async (level: JLPTLevel, forceRefresh = false) => {
    if (!forceRefresh && grammarCache[level].length > 0) return;

    setLoading(true);
    const points = await GeminiService.fetchGrammarList(level);
    setGrammarCache(prev => ({ ...prev, [level]: points }));
    setLoading(false);
  }, [grammarCache]);

  const loadVocab = useCallback(async (level: JLPTLevel, forceRefresh = false) => {
    if (!forceRefresh && vocabCache[level].length > 0) return;

    setLoading(true);
    const words = await GeminiService.fetchVocabularyList(level);
    setVocabCache(prev => ({ ...prev, [level]: words }));
    setLoading(false);
  }, [vocabCache]);

  // Effect to load data when entering LIST view
  useEffect(() => {
    if (view.type === 'LEVEL_LIST') {
      if (view.tab === ContentType.GRAMMAR) {
        loadGrammar(view.level);
      } else {
        loadVocab(view.level);
      }
    }
  }, [view, loadGrammar, loadVocab]);

  const handleGrammarClick = async (point: GrammarPoint) => {
    if (view.type !== 'LEVEL_LIST') return;
    
    // Optimistic update to detail view
    setView({ type: 'GRAMMAR_DETAIL', level: view.level, point });
    
    setLoadingDetail(true);
    const detail = await GeminiService.fetchGrammarDetail(point.pattern, view.level);
    setLoadingDetail(false);
    
    if (detail) {
      setView({ type: 'GRAMMAR_DETAIL', level: view.level, point, detail });
    }
  };

  const handleBack = () => {
    if (view.type === 'GRAMMAR_DETAIL') {
      setView({ type: 'LEVEL_LIST', level: view.level, tab: ContentType.GRAMMAR });
    } else if (view.type === 'LEVEL_LIST') {
      setView({ type: 'HOME' });
    }
  };

  // --- Render Components ---

  const renderHome = () => (
    <div className="p-6 space-y-8 max-w-md mx-auto">
      <header className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <span className="text-rose-500">日本語</span> Master
        </h1>
        <p className="text-slate-500 text-sm font-medium">JLPT Grammar & Vocabulary</p>
      </header>

      <div className="grid gap-5">
        {[...LEVELS].reverse().map((level) => {
          const styles = LEVEL_COLORS[level];
          return (
            <button
              key={level}
              onClick={() => handleLevelSelect(level)}
              className={`group relative overflow-hidden rounded-2xl p-6 text-left shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${styles.bg} border ${styles.border}`}
            >
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className={`text-3xl font-black ${styles.text}`}>{level}</h2>
                  <p className="text-slate-600 text-xs font-medium max-w-[200px] leading-relaxed opacity-90">
                    {LEVEL_DESCRIPTIONS[level]}
                  </p>
                </div>
                <HankoStamp level={level} className="transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-current ${styles.text}`} />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderLevelList = (level: JLPTLevel, tab: ContentType) => {
    const styles = LEVEL_COLORS[level];
    
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className={`text-xl font-bold ${styles.text} flex items-center gap-2`}>
              JLPT {level} Resources
            </h1>
            <HankoStamp level={level} size="sm" />
          </div>

          {/* Tab Navigation */}
          <div className="max-w-md mx-auto flex border-t border-slate-100">
            <button
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.GRAMMAR })}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                tab === ContentType.GRAMMAR ? `${styles.text} ${styles.border}` : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Grammar
            </button>
            <button
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.VOCABULARY })}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                tab === ContentType.VOCABULARY ? `${styles.text} ${styles.border}` : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <Languages className="w-4 h-4" /> Vocabulary
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-md mx-auto p-4">
          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              {tab === ContentType.GRAMMAR ? (
                <div className="space-y-3">
                  {grammarCache[level].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleGrammarClick(item)}
                      className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-lg font-jp font-bold ${styles.text} group-hover:scale-105 transition-transform origin-left`}>
                          {item.pattern}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-full">{level}</span>
                      </div>
                      <div className="text-slate-600 font-medium text-sm mb-1">{item.meaning}</div>
                      <div className="text-slate-400 text-xs italic">{item.romaji}</div>
                    </button>
                  ))}
                  <button 
                    onClick={() => loadGrammar(level, true)} 
                    className={`w-full py-4 mt-4 rounded-xl border-2 border-dashed ${styles.border} ${styles.text} font-bold opacity-70 hover:opacity-100 flex items-center justify-center gap-2`}
                  >
                    <RefreshCcw className="w-4 h-4" /> Load More Grammar
                  </button>
                </div>
              ) : (
                 <div className="space-y-3">
                   {vocabCache[level].map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center ${styles.text} font-bold text-xl font-jp shadow-inner`}>
                        {item.kanji.charAt(0)}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-baseline gap-2">
                            <span className="font-jp font-bold text-lg text-slate-800">{item.kanji}</span>
                            <span className="text-xs text-slate-500 font-jp">{item.kana}</span>
                         </div>
                         <div className="text-sm text-slate-600 leading-tight">{item.meaning}</div>
                      </div>
                    </div>
                   ))}
                   <button 
                    onClick={() => loadVocab(level, true)} 
                    className={`w-full py-4 mt-4 rounded-xl border-2 border-dashed ${styles.border} ${styles.text} font-bold opacity-70 hover:opacity-100 flex items-center justify-center gap-2`}
                  >
                    <RefreshCcw className="w-4 h-4" /> Load More Vocabulary
                  </button>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderGrammarDetail = (level: JLPTLevel, point: GrammarPoint, detail?: GrammarDetail) => {
    const styles = LEVEL_COLORS[level];
    
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
           <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${styles.bg} ${styles.text}`}>
              {level} Grammar
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className={`${styles.bg} p-8 text-center border-b ${styles.border} relative overflow-hidden`}>
               <div className="relative z-10">
                <h1 className="text-4xl font-black font-jp text-slate-800 mb-2">{point.pattern}</h1>
                <p className="text-lg text-slate-600 font-medium">{point.meaning}</p>
                <p className="text-sm text-slate-400 mt-1">{point.romaji}</p>
               </div>
               <HankoStamp level={level} className="absolute top-2 right-2 opacity-20" size="lg" />
            </div>
            
            <div className="p-6 space-y-6">
              {loadingDetail || !detail ? (
                <DetailSkeleton />
              ) : (
                <>
                  <section>
                    <h3 className={`text-xs uppercase tracking-wider font-bold ${styles.text} mb-3 flex items-center gap-2`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      Formation
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-slate-700 font-mono text-sm leading-relaxed border border-slate-100">
                      {detail.formation}
                    </div>
                  </section>

                  <section>
                    <h3 className={`text-xs uppercase tracking-wider font-bold ${styles.text} mb-3 flex items-center gap-2`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      Explanation
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {detail.explanation}
                    </p>
                  </section>
                  
                  {detail.synonyms && detail.synonyms.length > 0 && (
                     <section>
                      <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Synonyms</h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.synonyms.map(syn => (
                          <span key={syn} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{syn}</span>
                        ))}
                      </div>
                     </section>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Examples Card */}
          {detail && !loadingDetail && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 px-2 flex items-center gap-2">
                <Volume2 className={`w-5 h-5 ${styles.text}`} /> 
                Example Sentences
              </h3>
              
              {detail.examples.map((ex, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 transition-colors">
                  <p className="text-lg font-jp font-medium text-slate-800 mb-1 leading-relaxed">
                    {ex.japanese}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{ex.romaji}</p>
                  <p className="text-sm text-slate-600 border-l-2 pl-3 border-slate-200">
                    {ex.english}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Switch ---

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      {view.type === 'HOME' && renderHome()}
      {view.type === 'LEVEL_LIST' && renderLevelList(view.level, view.tab)}
      {view.type === 'GRAMMAR_DETAIL' && renderGrammarDetail(view.level, view.point, view.detail)}
    </div>
  );
};

export default App;
