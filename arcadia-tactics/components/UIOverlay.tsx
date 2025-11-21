
import React, { useRef, useEffect, useState } from 'react';
import { GameLogEntry, Entity, CombatStatsComponent, BattleAction } from '../types';

interface UIOverlayProps {
  logs: GameLogEntry[];
  playerStats?: CombatStatsComponent;
  turnOrder?: string[];
  currentTurn?: string;
  onActionSelect?: (action: BattleAction) => void;
  selectedAction?: BattleAction | null;
  hasMoved?: boolean;
  hasActed?: boolean;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  logs, 
  playerStats, 
  turnOrder, 
  currentTurn,
  onActionSelect,
  selectedAction,
  hasMoved = false,
  hasActed = false
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  useEffect(() => {
    if (isLogExpanded) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLogExpanded]);

  const isPlayerTurn = currentTurn === 'player';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 md:p-6 z-20 overflow-hidden">
        {/* Top Bar: Stats & Turn Order */}
        <div className="flex flex-row justify-between items-start gap-2 w-full max-w-5xl mx-auto">
            {playerStats && (
                <div className="bg-slate-950/90 backdrop-blur-md border border-amber-600/30 p-2 md:p-4 rounded-xl text-amber-50 pointer-events-auto shadow-2xl w-[45%] md:w-72 relative overflow-hidden transition-all shrink-0">
                    {/* Decorative Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                    
                    <div className="flex items-baseline justify-between mb-1 md:mb-3">
                         <span className="font-serif font-bold text-xs md:text-xl text-amber-100 tracking-wide truncate">Player</span>
                         <span className="text-[9px] md:text-[10px] font-bold bg-amber-900/50 text-amber-200 px-1.5 py-0.5 rounded border border-amber-700/50 uppercase tracking-wider">Lvl 1</span>
                    </div>
                    
                    {/* Health Bar */}
                    <div className="relative w-full h-1.5 md:h-3 bg-slate-900 rounded-full mb-1 overflow-hidden border border-slate-700 shadow-inner">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-500" 
                            style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                        />
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10"></div>
                    </div>
                    
                    <div className="text-[9px] md:text-xs text-right mb-1 md:mb-3 font-mono text-slate-400 flex justify-end items-center">
                        <span>{playerStats.hp}</span>
                        <span className="text-slate-600 mx-0.5">/</span>
                        <span>{playerStats.maxHp} HP</span>
                    </div>
                    
                    <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                        <div className="bg-slate-900/50 p-1 md:p-2 rounded text-center border border-slate-700/50 flex-1 flex flex-col justify-center min-w-0">
                            <span className="block text-slate-500 text-[8px] md:text-[9px] uppercase tracking-widest truncate">Def</span>
                            <span className="text-xs md:text-lg font-serif text-slate-200">{playerStats.ac}</span>
                        </div>
                        <div className="bg-slate-900/50 p-1 md:p-2 rounded text-center border border-slate-700/50 flex-1 flex flex-col justify-center min-w-0">
                            <span className="block text-slate-500 text-[8px] md:text-[9px] uppercase tracking-widest truncate">Init</span>
                            <span className="text-xs md:text-lg font-serif text-slate-200">+{playerStats.initiativeBonus}</span>
                        </div>
                    </div>
                </div>
            )}

            {turnOrder && (
                <div className="flex gap-1 md:gap-3 pointer-events-auto p-1 md:p-2 rounded-full bg-slate-950/40 backdrop-blur-sm border border-white/5 flex-wrap justify-end max-w-[50%]">
                    {turnOrder.map((id, idx) => (
                        <div 
                            key={idx}
                            className={`relative w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-lg shadow-lg transition-all duration-300 shrink-0
                                ${id === currentTurn 
                                    ? 'bg-gradient-to-b from-amber-700 to-amber-900 border border-amber-400 text-amber-100 scale-110 z-10 ring-1 md:ring-4 ring-amber-500/20' 
                                    : 'bg-slate-800 border border-slate-600 text-slate-500 grayscale scale-90'}
                            `}
                        >
                            {id.includes('player') ? '🧙‍♂️' : '👹'}
                            
                            {id === currentTurn && (
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-amber-400"></div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Bottom Section Wrapper */}
        <div className="flex flex-col md:flex-row justify-between items-end w-full gap-2 md:gap-4">
            
            {/* Action Bar (Bottom Center/Left) */}
            {onActionSelect && isPlayerTurn && (
                <div className="pointer-events-auto flex gap-1.5 md:gap-4 bg-slate-900/95 p-1.5 md:p-2 rounded-xl border border-slate-600 shadow-2xl backdrop-blur-xl order-2 md:order-1 mx-auto md:mx-0">
                    <ActionButton 
                        label="Move" 
                        icon="🦶" 
                        active={selectedAction === BattleAction.MOVE} 
                        disabled={hasMoved}
                        onClick={() => onActionSelect(BattleAction.MOVE)} 
                    />
                    <ActionButton 
                        label="Attack" 
                        icon="⚔️" 
                        active={selectedAction === BattleAction.ATTACK} 
                        disabled={hasActed}
                        onClick={() => onActionSelect(BattleAction.ATTACK)} 
                    />
                    <ActionButton 
                        label="Magic" 
                        icon="🔮" 
                        active={selectedAction === BattleAction.MAGIC} 
                        disabled={hasActed}
                        onClick={() => onActionSelect(BattleAction.MAGIC)} 
                    />
                    <ActionButton 
                        label="Item" 
                        icon="🎒" 
                        active={selectedAction === BattleAction.ITEM} 
                        disabled={hasActed}
                        onClick={() => onActionSelect(BattleAction.ITEM)} 
                    />
                     <ActionButton 
                        label="End" 
                        icon="⌛" 
                        active={false}
                        onClick={() => onActionSelect(BattleAction.WAIT)} 
                        variant="danger"
                    />
                </div>
            )}

            {/* Action Log - Collapsible */}
            <div 
                className={`pointer-events-auto w-full max-w-lg self-center md:self-end bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ease-in-out order-1 md:order-2
                ${isLogExpanded ? 'h-36 md:h-48' : 'h-8 md:h-10'}`}
            >
                <div 
                    onClick={() => setIsLogExpanded(!isLogExpanded)}
                    className="bg-slate-900/90 px-3 md:px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                    <span className="uppercase tracking-widest font-serif text-amber-500 flex items-center gap-2">
                        Adventure Log
                        <span className="text-[9px] bg-slate-800 px-1.5 rounded text-slate-500">{logs.length}</span>
                    </span>
                    <span className="text-slate-500 hover:text-amber-400">{isLogExpanded ? '▼' : '▲'}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1.5 md:space-y-3 font-sans text-xs md:text-sm custom-scrollbar bg-black/20">
                    {logs.map(log => (
                        <div key={log.id} className={`flex gap-2 md:gap-3 leading-relaxed border-l-2 pl-2 md:pl-3 py-0.5
                            ${log.type === 'combat' ? 'border-red-500/50 text-red-200 bg-red-900/10' : 
                            log.type === 'roll' ? 'border-amber-500/50 text-amber-200 bg-amber-900/10' : 
                            log.type === 'narrative' ? 'border-blue-500/50 text-blue-100 bg-blue-900/10 italic' :
                            'border-slate-600 text-slate-300'}
                        `}>
                            <span className="opacity-40 text-[9px] md:text-[10px] font-mono mt-0.5 whitespace-nowrap hidden sm:inline">
                                {new Date(log.timestamp).toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'})}
                            </span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    </div>
  );
};

interface ActionButtonProps {
    label: string;
    icon: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    variant?: 'normal' | 'danger';
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, active, disabled, onClick, variant = 'normal' }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-lg border transition-all
            ${disabled 
                ? 'bg-slate-800/50 border-slate-700 text-slate-600 grayscale cursor-not-allowed' 
                : active
                    ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                    : variant === 'danger'
                        ? 'bg-red-900/40 border-red-700 text-red-200 hover:bg-red-800'
                        : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-400'
            }
        `}
    >
        <span className="text-lg md:text-2xl mb-0.5 md:mb-1">{icon}</span>
        <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </button>
);
