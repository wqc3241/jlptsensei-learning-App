import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  Search, 
  Languages,
  RefreshCcw,
  Volume2
} from 'lucide-react';
import { JLPTLevel, GrammarPoint, GrammarDetail, VocabularyItem, ContentType } from '../types';
import { LEVELS, LEVEL_COLORS, LEVEL_DESCRIPTIONS } from '../constants';
import * as GeminiService from '../services/geminiService';
import HankoStamp from './HankoStamp';
import { ListSkeleton, DetailSkeleton } from './LoadingSkeleton';

type ViewState = 
  | { type: 'HOME' }
  | { type: 'LEVEL_LIST'; level: JLPTLevel; tab: ContentType }
  | { type: 'GRAMMAR_DETAIL'; level: JLPTLevel; point: GrammarPoint; detail?: GrammarDetail };

const ReferenceView: React.FC = () => {
  const [view, setView] = useState<ViewState>({ type: 'HOME' });
  const [grammarCache, setGrammarCache] = useState<Record<JLPTLevel, GrammarPoint[]>>({
    N5: [], N4: [], N3: [], N2: [], N1: []
  });
  const [vocabCache, setVocabCache] = useState<Record<JLPTLevel, VocabularyItem[]>>({
    N5: [], N4: [], N3: [], N2: [], N1: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
    setView({ type: 'GRAMMAR_DETAIL', level: view.level, point });
    setLoadingDetail(true);
    const detail = await GeminiService.fetchGrammarDetail(point.pattern, view.level);
    setLoadingDetail(false);
    if (detail) {
      setView({ type: 'GRAMMAR_DETAIL', level: view.level, point, detail });
    }
  };

  const renderHome = () => (
    <div className="p-6 space-y-6 max-w-md mx-auto pb-24">
       <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="text-rose-500" /> Reference Library
        </h1>
        <p className="text-slate-500 text-sm">Browse full lists of grammar & vocab</p>
      </header>

      <div className="grid gap-4">
        {[...LEVELS].reverse().map((level) => {
          const styles = LEVEL_COLORS[level];
          return (
            <button
              key={level}
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.GRAMMAR })}
              className={`group relative overflow-hidden rounded-xl p-5 text-left shadow-sm border transition-all hover:shadow-md active:scale-[0.98] ${styles.bg} ${styles.border}`}
            >
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className={`text-2xl font-black ${styles.text}`}>{level}</h2>
                    <p className="text-xs text-slate-500 font-medium">Full Grammar & Vocab List</p>
                 </div>
                 <ChevronLeft className="rotate-180 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderLevelList = (level: JLPTLevel, tab: ContentType) => {
    const styles = LEVEL_COLORS[level];
    
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <button 
              onClick={() => setView({ type: 'HOME' })}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className={`text-lg font-bold ${styles.text}`}>JLPT {level} Library</h1>
            <HankoStamp level={level} size="sm" />
          </div>
          <div className="max-w-md mx-auto flex border-t border-slate-100">
            <button
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.GRAMMAR })}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                tab === ContentType.GRAMMAR ? `${styles.text} ${styles.border}` : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Grammar
            </button>
            <button
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.VOCABULARY })}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                tab === ContentType.VOCABULARY ? `${styles.text} ${styles.border}` : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <Languages className="w-4 h-4" /> Vocabulary
            </button>
          </div>
        </header>

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
                        <span className={`text-lg font-jp font-bold ${styles.text} group-hover:translate-x-1 transition-transform`}>
                          {item.pattern}
                        </span>
                      </div>
                      <div className="text-slate-600 font-medium text-sm mb-1">{item.meaning}</div>
                      <div className="text-slate-400 text-xs italic">{item.romaji}</div>
                    </button>
                  ))}
                  <button 
                    onClick={() => loadGrammar(level, true)} 
                    className="w-full py-4 mt-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-white hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Load More
                  </button>
                </div>
              ) : (
                 <div className="space-y-3">
                   {vocabCache[level].map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center ${styles.text} font-bold text-lg font-jp`}>
                        {item.kanji.charAt(0)}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-baseline gap-2">
                            <span className="font-jp font-bold text-slate-800">{item.kanji}</span>
                            <span className="text-xs text-slate-500 font-jp">{item.kana}</span>
                         </div>
                         <div className="text-sm text-slate-600 leading-tight">{item.meaning}</div>
                      </div>
                    </div>
                   ))}
                   <button 
                    onClick={() => loadVocab(level, true)} 
                    className="w-full py-4 mt-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-white hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Load More
                  </button>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderDetail = (level: JLPTLevel, point: GrammarPoint, detail?: GrammarDetail) => {
    const styles = LEVEL_COLORS[level];
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
           <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <button 
              onClick={() => setView({ type: 'LEVEL_LIST', level, tab: ContentType.GRAMMAR })}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${styles.bg} ${styles.text}`}>
              {level} Grammar
            </span>
            <div className="w-10" />
          </div>
        </header>

        <div className="max-w-md mx-auto p-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className={`${styles.bg} p-6 text-center border-b ${styles.border}`}>
               <h1 className="text-3xl font-black font-jp text-slate-800 mb-2">{point.pattern}</h1>
               <p className="text-slate-600 font-medium">{point.meaning}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {loadingDetail || !detail ? (
                <DetailSkeleton />
              ) : (
                <>
                  <section>
                    <h3 className={`text-xs uppercase tracking-wider font-bold ${styles.text} mb-2`}>Formation</h3>
                    <div className="bg-slate-50 p-3 rounded-lg text-slate-700 font-mono text-sm border border-slate-100">
                      {detail.formation}
                    </div>
                  </section>
                  <section>
                    <h3 className={`text-xs uppercase tracking-wider font-bold ${styles.text} mb-2`}>Explanation</h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{detail.explanation}</p>
                  </section>
                </>
              )}
            </div>
          </div>

          {detail && !loadingDetail && detail.examples && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Examples</h3>
              {detail.examples.map((ex, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-lg font-jp font-medium text-slate-800 mb-1">{ex.japanese}</p>
                  <p className="text-xs text-slate-400 mb-2">{ex.romaji}</p>
                  <p className="text-sm text-slate-600">{ex.english}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      {view.type === 'HOME' && renderHome()}
      {view.type === 'LEVEL_LIST' && renderLevelList(view.level, view.tab)}
      {view.type === 'GRAMMAR_DETAIL' && renderDetail(view.level, view.point, view.detail)}
    </div>
  );
};

export default ReferenceView;
