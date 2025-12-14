import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle, AlertCircle, Volume2 } from 'lucide-react';
import { UnitContent, JLPTLevel } from '../types';
import { LEVEL_COLORS } from '../constants';
import HankoStamp from './HankoStamp';

interface LessonViewProps {
  level: JLPTLevel;
  unit: UnitContent;
  onComplete: () => void;
  onExit: () => void;
}

type Phase = 'INTRO' | 'QUIZ' | 'RESULT';

const LessonView: React.FC<LessonViewProps> = ({ level, unit, onComplete, onExit }) => {
  const styles = LEVEL_COLORS[level];
  const [phase, setPhase] = useState<Phase>('INTRO');
  
  // Intro State
  const [cardIndex, setCardIndex] = useState(0);
  const totalCards = unit.grammar.length + unit.vocabulary.length;
  
  // Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);

  // --- Logic Helpers ---

  const getCardContent = (index: number) => {
    if (index < unit.grammar.length) {
      return { type: 'GRAMMAR', data: unit.grammar[index] };
    }
    return { type: 'VOCAB', data: unit.vocabulary[index - unit.grammar.length] };
  };

  const handleNextCard = () => {
    if (cardIndex < totalCards - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      setPhase('QUIZ');
    }
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
    if (selectedOption === unit.quiz[quizIndex].correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex < unit.quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setPhase('RESULT');
    }
  };

  // --- Renderers ---

  if (phase === 'RESULT') {
    const isPass = score >= unit.quiz.length - 1; // Allow 1 mistake
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center animate-in slide-in-from-bottom duration-300">
        <div className="mb-8 relative">
          <HankoStamp level={level} size="lg" className={`scale-150 ${isPass ? 'animate-bounce' : 'grayscale opacity-50'}`} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">
          {isPass ? 'Unit Complete!' : 'Try Again'}
        </h2>
        <p className="text-slate-500 mb-8">
          You got {score} out of {unit.quiz.length} correct.
        </p>
        <button
          onClick={() => {
            if (isPass) onComplete();
            else onExit();
          }}
          className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 ${isPass ? styles.accent : 'bg-slate-400'}`}
        >
          {isPass ? 'Continue' : 'Back to Path'}
        </button>
      </div>
    );
  }

  const progress = phase === 'INTRO' 
    ? ((cardIndex + 1) / totalCards) * 50 
    : 50 + ((quizIndex + 1) / unit.quiz.length) * 50;

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-white border-b border-slate-100">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.accent} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        
        {phase === 'INTRO' && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right duration-300 key={cardIndex}">
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-400">New Learning</h2>
            
            {(() => {
              const { type, data } = getCardContent(cardIndex);
              return (
                <div className="bg-white rounded-3xl shadow-xl border-b-8 border-slate-200 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                  {type === 'GRAMMAR' ? (
                    <>
                      <div className={`text-3xl font-black font-jp mb-2 ${styles.text}`}>{(data as any).pattern}</div>
                      <div className="text-slate-400 text-sm mb-6">{(data as any).romaji}</div>
                      <div className="text-xl text-slate-700 font-medium mb-4">{(data as any).meaning}</div>
                      <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 font-mono w-full text-left">
                        <span className="font-bold text-xs uppercase block text-slate-400 mb-1">Formation</span>
                        {(data as any).formation}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-4xl font-jp font-bold mb-6 shadow-inner">
                        {(data as any).kanji.charAt(0)}
                      </div>
                      <div className="text-3xl font-black font-jp text-slate-800 mb-2">{(data as any).kanji}</div>
                      <div className="text-slate-400 text-lg mb-4 font-jp">{(data as any).kana}</div>
                      <div className="text-xl font-medium text-slate-600">{(data as any).meaning}</div>
                    </>
                  )}
                </div>
              );
            })()}

            <button
              onClick={handleNextCard}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-md ${styles.accent}`}
            >
              Got it
            </button>
          </div>
        )}

        {phase === 'QUIZ' && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right duration-300 key={quizIndex}">
             <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-400">Quiz Question</h2>
             
             <div className="text-2xl font-bold text-slate-800 text-center mb-8 font-jp">
               {unit.quiz[quizIndex].question}
             </div>

             <div className="space-y-3">
               {unit.quiz[quizIndex].options.map((option, idx) => {
                 let stateClass = "bg-white border-slate-200 hover:bg-slate-50";
                 if (isAnswerChecked) {
                   if (idx === unit.quiz[quizIndex].correctIndex) stateClass = "bg-green-100 border-green-400 text-green-800";
                   else if (idx === selectedOption) stateClass = "bg-red-100 border-red-400 text-red-800";
                   else stateClass = "bg-white border-slate-200 opacity-50";
                 } else if (selectedOption === idx) {
                   stateClass = `bg-blue-50 ${styles.border} ${styles.text}`;
                 }

                 return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full p-4 rounded-xl border-2 font-medium text-left transition-all ${stateClass}`}
                  >
                    {option}
                  </button>
                 );
               })}
             </div>
          </div>
        )}
      </div>

      {/* Footer for Quiz Action */}
      {phase === 'QUIZ' && (
        <div className={`p-4 border-t ${isAnswerChecked ? (selectedOption === unit.quiz[quizIndex].correctIndex ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100') : 'bg-white border-slate-100'}`}>
          <div className="max-w-md mx-auto">
            {isAnswerChecked ? (
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    {selectedOption === unit.quiz[quizIndex].correctIndex ? (
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle /></div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"><X /></div>
                    )}
                    <div>
                      <div className={`font-bold ${selectedOption === unit.quiz[quizIndex].correctIndex ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedOption === unit.quiz[quizIndex].correctIndex ? 'Correct!' : 'Incorrect'}
                      </div>
                      <div className="text-sm text-slate-600 max-w-[200px] truncate">{unit.quiz[quizIndex].explanation}</div>
                    </div>
                 </div>
                 <button onClick={handleNextQuestion} className={`px-6 py-3 rounded-xl font-bold text-white ${selectedOption === unit.quiz[quizIndex].correctIndex ? 'bg-green-500' : 'bg-red-500'}`}>
                   Continue
                 </button>
               </div>
            ) : (
              <button
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-md transition-all ${selectedOption !== null ? styles.accent : 'bg-slate-300'}`}
              >
                Check Answer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonView;
