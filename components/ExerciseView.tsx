import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, MessageSquare, Images, ListMusic, ChevronLeft, 
  Mic, Volume2, Sparkles, RefreshCcw, Loader2, Phone, PhoneOff, Activity
} from 'lucide-react';
import { JLPTLevel, ExerciseMode, ChatMessage, FlashcardData, PracticeSentenceData } from '../types';
import { LEVEL_COLORS, LEVELS } from '../constants';
import * as GeminiService from '../services/geminiService';

const ExerciseView: React.FC = () => {
  const [mode, setMode] = useState<ExerciseMode>('MENU');
  const [level, setLevel] = useState<JLPTLevel>('N5');
  
  // Scenario State (Live API)
  const [scenarioInput, setScenarioInput] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<ChatMessage[]>([]);
  const [liveSession, setLiveSession] = useState<{ disconnect: () => void } | null>(null);
  const nextStartTime = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flashcard State
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Sentences State
  const [sentences, setSentences] = useState<PracticeSentenceData[]>([]);
  const [isLoadingSentences, setIsLoadingSentences] = useState(false);
  const [visibleSentenceId, setVisibleSentenceId] = useState<string | null>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // --- Audio Helper ---
  const playAudio = async (text: string, id: string) => {
    if (playingAudioId) return; // Prevent multiple concurrent plays
    
    // 1. IMPORTANT: Resume context immediately on click to satisfy browser autoplay policy
    await GeminiService.resumeAudioContext();
    
    setPlayingAudioId(id);

    try {
      const audioData = await GeminiService.generateSpeech(text);
      if (audioData) {
        await GeminiService.playPcmData(audioData);
      }
    } catch (e) {
      console.error("Playback failed", e);
    } finally {
      setPlayingAudioId(null);
    }
  };

  // --- Scenario Logic (Live API) ---
  const startLiveScenario = async () => {
    if (!scenarioInput.trim()) return;
    setMode('SCENARIO');
    setIsCallActive(true);
    setLiveTranscript([]);
    nextStartTime.current = 0; // Reset audio sync

    const session = await GeminiService.connectToLiveScenario(level, scenarioInput, {
      onAudioData: (base64) => {
        // Queue and play raw audio chunks
        const ctx = GeminiService.getAudioContext();
        const buffer = GeminiService.decodeAudioData(base64);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        // Schedule next chunk to ensure smooth playback
        const currentTime = ctx.currentTime;
        if (nextStartTime.current < currentTime) {
           nextStartTime.current = currentTime;
        }
        source.start(nextStartTime.current);
        nextStartTime.current += buffer.duration;
      },
      onTranscription: (text, isUser) => {
        setLiveTranscript(prev => {
          const lastMsg = prev[prev.length - 1];
          const role = isUser ? 'user' : 'model';
          
          // Append to last message if role matches (fixes fragmentation)
          if (lastMsg && lastMsg.role === role) {
             const updated = [...prev];
             updated[updated.length - 1] = {
                 ...lastMsg,
                 text: lastMsg.text + text
             };
             return updated;
          }
          // Otherwise start new message bubble
          return [...prev, { id: Date.now().toString(), role, text }];
        });
      },
      onClose: () => {
        setIsCallActive(false);
        setLiveSession(null);
      }
    });

    setLiveSession(session);
  };

  const endCall = () => {
    if (liveSession) {
      liveSession.disconnect();
      setLiveSession(null);
    }
    setIsCallActive(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (liveSession) liveSession.disconnect();
    };
  }, []);

  // --- Flashcard Logic ---
  const loadFlashcards = async () => {
    setMode('FLASHCARDS');
    setIsLoadingCards(true);
    setFlashcards([]);
    setCardIndex(0);
    setActiveImage(null);
    const cards = await GeminiService.fetchFlashcards(level, 5);
    setFlashcards(cards);
    setIsLoadingCards(false);
    
    if (cards.length > 0) {
      loadImage(cards[0]);
    }
  };

  const loadImage = async (card: FlashcardData) => {
    if (card.imageUrl) {
      setActiveImage(card.imageUrl);
      return;
    }
    setImageLoading(true);
    const b64 = await GeminiService.generateImage(card.imagePrompt);
    if (b64) {
      card.imageUrl = b64; // Cache it
      setActiveImage(b64);
    }
    setImageLoading(false);
  };

  const nextCard = () => {
    if (cardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      const nextIdx = cardIndex + 1;
      setCardIndex(nextIdx);
      setActiveImage(flashcards[nextIdx].imageUrl || null);
      loadImage(flashcards[nextIdx]);
    }
  };

  // --- Sentence Logic ---
  const loadSentences = async () => {
    setMode('SENTENCES');
    setIsLoadingSentences(true);
    const sents = await GeminiService.fetchPracticeSentences(level, 5);
    setSentences(sents);
    setIsLoadingSentences(false);
  };

  // --- Renderers ---

  const renderMenu = () => (
    <div className="p-6 space-y-6 max-w-md mx-auto pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Dumbbell className="text-rose-500" /> Practice Lab
        </h1>
        <p className="text-slate-500 text-sm">Interactive AI Exercises</p>
      </header>

      {/* Level Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {LEVELS.map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap ${
              level === l ? LEVEL_COLORS[l].bg + ' ' + LEVEL_COLORS[l].text + ' ring-2 ring-offset-1 ' + LEVEL_COLORS[l].border 
              : 'bg-white text-slate-400 border border-slate-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Scenario Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><MessageSquare /></div>
             <div>
               <h3 className="font-bold text-slate-800">Roleplay Scenario</h3>
               <p className="text-xs text-slate-500">Real-time voice conversation</p>
             </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={scenarioInput}
              onChange={(e) => setScenarioInput(e.target.value)}
              placeholder="e.g. Asking for directions..."
              className="flex-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-300"
            />
            <button 
              onClick={startLiveScenario}
              disabled={!scenarioInput}
              className="px-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" /> Start
            </button>
          </div>
        </div>

        {/* Vocab Review Card */}
        <button 
          onClick={loadFlashcards}
          className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Images /></div>
          <div className="flex-1">
             <h3 className="font-bold text-slate-800">Visual Vocabulary</h3>
             <p className="text-xs text-slate-500">Flashcards with AI-generated images</p>
          </div>
          <ChevronLeft className="rotate-180 text-slate-300" />
        </button>

        {/* Sentences Card */}
        <button 
          onClick={loadSentences}
          className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ListMusic /></div>
          <div className="flex-1">
             <h3 className="font-bold text-slate-800">Sentence Practice</h3>
             <p className="text-xs text-slate-500">Listening & Grammar breakdown</p>
          </div>
          <ChevronLeft className="rotate-180 text-slate-300" />
        </button>
      </div>
    </div>
  );

  const renderScenario = () => (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-900 text-white">
      <header className="p-4 flex items-center gap-3 border-b border-slate-800">
        <button onClick={() => { endCall(); setMode('MENU'); }}><ChevronLeft className="text-slate-400" /></button>
        <div className="flex-1">
          <h2 className="font-bold text-sm truncate">{scenarioInput}</h2>
          <span className="text-xs text-slate-400 flex items-center gap-2">
            {isCallActive ? <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> : <span className="w-2 h-2 rounded-full bg-red-500"/>}
            {isCallActive ? 'Live Voice Call' : 'Disconnected'}
          </span>
        </div>
        <button onClick={endCall} className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
          <PhoneOff className="w-5 h-5" />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {liveTranscript.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center opacity-50">
             <Activity className="w-16 h-16 animate-pulse mb-4" />
             <p className="text-sm">Connecting...</p>
           </div>
        )}
        {liveTranscript.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] p-4 rounded-2xl text-base ${
               msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
             }`}>
               {msg.text}
             </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center pb-safe">
         <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${isCallActive ? 'bg-purple-500/20 ring-4 ring-purple-500/30' : 'bg-slate-800'}`}>
            <Mic className={`w-8 h-8 ${isCallActive ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
         </div>
      </div>
    </div>
  );

  const renderFlashcards = () => {
    if (isLoadingCards && flashcards.length === 0) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;
    }

    const card = flashcards[cardIndex];
    if (!card) return null;

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100">
         <header className="p-4 flex items-center justify-between">
           <button onClick={() => setMode('MENU')}><ChevronLeft className="text-slate-500" /></button>
           <span className="font-bold text-slate-600">{cardIndex + 1} / {flashcards.length}</span>
           <div className="w-6" />
         </header>

         <div className="flex-1 flex flex-col items-center justify-center p-6" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`w-full max-w-sm aspect-[3/4] bg-white rounded-3xl shadow-xl overflow-hidden relative transition-all duration-500 transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''} preserve-3d cursor-pointer`}>
              
              {/* Front */}
              <div className={`absolute inset-0 flex flex-col ${isFlipped ? 'invisible' : 'visible'}`}>
                 <div className="h-3/5 bg-slate-200 relative">
                   {activeImage ? (
                     <img src={`data:image/jpeg;base64,${activeImage}`} className="w-full h-full object-cover" alt="Generated" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-400">
                       {imageLoading ? <Sparkles className="animate-pulse" /> : <Images />}
                     </div>
                   )}
                 </div>
                 <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <h2 className="text-4xl font-black text-slate-800 font-jp mb-2">{card.kanji}</h2>
                    <p className="text-sm text-slate-400">Tap to flip</p>
                 </div>
              </div>

              {/* Back */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 bg-orange-50 [transform:rotateY(180deg)] ${isFlipped ? 'visible' : 'invisible'}`}>
                 <h2 className="text-3xl font-black text-slate-800 font-jp mb-2">{card.kanji}</h2>
                 <p className="text-xl text-orange-600 font-jp mb-6">{card.kana}</p>
                 <p className="text-lg text-slate-700 font-medium text-center mb-8">{card.meaning}</p>
                 <button 
                   onClick={(e) => { e.stopPropagation(); playAudio(card.kanji, card.id); }}
                   className="p-4 bg-white rounded-full shadow-sm text-orange-500 hover:scale-110 transition-transform"
                 >
                   {playingAudioId === card.id ? (
                     <Loader2 className="w-8 h-8 animate-spin" />
                   ) : (
                     <Volume2 className="w-8 h-8" />
                   )}
                 </button>
              </div>
            </div>
         </div>

         <div className="p-6 flex justify-center">
            {cardIndex < flashcards.length - 1 ? (
              <button onClick={nextCard} className="w-full max-w-sm py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg">
                Next Card
              </button>
            ) : (
              <button onClick={() => setMode('MENU')} className="w-full max-w-sm py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg">
                Finish Review
              </button>
            )}
         </div>
      </div>
    );
  };

  const renderSentences = () => (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col">
       <header className="p-4 bg-white shadow-sm flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setMode('MENU')}><ChevronLeft className="text-slate-500" /></button>
          <h2 className="font-bold text-slate-800">Sentence Practice ({level})</h2>
       </header>

       <div className="flex-1 p-4 space-y-4 pb-24">
         {isLoadingSentences ? (
           <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />)}
           </div>
         ) : (
           sentences.map((sent) => (
             <div key={sent.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{sent.grammarPoint}</span>
                  <button onClick={() => playAudio(sent.japanese, sent.id)} className="text-slate-400 hover:text-emerald-500">
                    {playingAudioId === sent.id ? (
                       <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    ) : (
                       <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-lg font-jp font-bold text-slate-800 mb-4 leading-relaxed">
                  {sent.japanese}
                </p>

                {visibleSentenceId === sent.id ? (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-slate-500 mb-1">{sent.romaji}</p>
                    <p className="text-base text-slate-700 font-medium">{sent.english}</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setVisibleSentenceId(sent.id)}
                    className="text-sm text-slate-400 font-medium hover:text-emerald-600 transition-colors"
                  >
                    Tap to reveal translation
                  </button>
                )}
             </div>
           ))
         )}
         {!isLoadingSentences && sentences.length > 0 && (
            <button onClick={loadSentences} className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-emerald-600">
               <RefreshCcw className="w-4 h-4" /> Load More
            </button>
         )}
       </div>
    </div>
  );

  return (
    <>
      {mode === 'MENU' && renderMenu()}
      {mode === 'SCENARIO' && renderScenario()}
      {mode === 'FLASHCARDS' && renderFlashcards()}
      {mode === 'SENTENCES' && renderSentences()}
    </>
  );
};

export default ExerciseView;