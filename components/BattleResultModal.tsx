
import React from 'react';

interface BattleResultModalProps {
  type: 'victory' | 'defeat';
  rewards?: { xp: number; gold: number };
  onContinue?: () => void;
  onRestart?: () => void;
  onQuit?: () => void;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({ 
  type, 
  rewards, 
  onContinue, 
  onRestart, 
  onQuit 
}) => {
  const isVictory = type === 'victory';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className={`
        relative w-full max-w-md p-1 rounded-2xl overflow-hidden shadow-2xl transform transition-all scale-100
        ${isVictory ? 'bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800' : 'bg-gradient-to-b from-slate-600 via-slate-800 to-black'}
      `}>
        {/* Inner Content */}
        <div className="bg-slate-950/90 m-0.5 rounded-[14px] p-8 text-center border border-white/10">
          
          {/* Icon */}
          <div className="mb-6 text-6xl animate-bounce">
            {isVictory ? '🏆' : '💀'}
          </div>

          {/* Title */}
          <h2 className={`
            text-4xl md:text-5xl font-serif font-bold mb-2 tracking-wider
            ${isVictory ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500' : 'text-red-500'}
          `}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </h2>

          {/* Divider */}
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

          {/* Rewards or Message */}
          {isVictory && rewards ? (
            <div className="space-y-4 mb-8 animate-in slide-in-from-bottom-4 delay-150 duration-700">
              <p className="text-slate-300 text-sm uppercase tracking-widest">Rewards Gained</p>
              <div className="flex justify-center gap-6">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-amber-500/30 min-w-[80px]">
                  <span className="block text-2xl font-bold text-amber-400">+{rewards.xp}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">XP</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-yellow-500/30 min-w-[80px]">
                  <span className="block text-2xl font-bold text-yellow-400">{rewards.gold}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Gold</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-slate-400 italic">
                "The path of the adventurer is paved with peril. Rise again."
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isVictory ? (
              <button 
                onClick={onContinue}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-0.5 uppercase tracking-widest text-sm"
              >
                Continue Journey
              </button>
            ) : (
              <button 
                onClick={onRestart}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg border border-slate-500 transition-all uppercase tracking-widest text-sm"
              >
                Try Again
              </button>
            )}
            
            {!isVictory && (
                <button 
                    onClick={onQuit}
                    className="w-full text-slate-500 hover:text-slate-300 py-2 text-xs uppercase tracking-widest transition-colors"
                >
                    Return to Title
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
