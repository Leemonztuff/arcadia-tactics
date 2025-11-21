
import React, { useState, useMemo } from 'react';
import { CharacterRace, CharacterClass, Attributes, Ability } from '../types';
import { BASE_STATS, RACE_BONUS } from '../constants';
import { getModifier } from '../services/dndRules';

interface CharacterCreationProps {
  onComplete: (name: string, race: CharacterRace, cls: CharacterClass, stats: Attributes) => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [race, setRace] = useState<CharacterRace>(CharacterRace.HUMAN);
  const [cls, setCls] = useState<CharacterClass>(CharacterClass.FIGHTER);
  
  // Calculate final stats based on selection
  const currentStats: Attributes = useMemo(() => {
      const base = { ...BASE_STATS[cls] };
      const bonus = RACE_BONUS[race];
      (Object.keys(base) as Ability[]).forEach(k => {
          if (bonus[k]) base[k] += bonus[k]!;
      });
      return base;
  }, [race, cls]);

  const handleNext = () => {
    if (step === 3) {
        onComplete(name, race, cls, currentStats);
    } else {
        setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900 via-slate-900 to-black pointer-events-none" />
      
      {/* Main Container - Scrollable on mobile */}
      <div className="relative z-10 w-full h-full md:h-auto max-h-screen overflow-y-auto p-4 md:p-0 flex flex-col items-center justify-center">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-600/30 p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] max-w-4xl w-full text-amber-50 transition-all my-auto">
            <header className="text-center mb-6 md:mb-8">
                <h1 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-sm mb-2">
                    Legend Begins
                </h1>
                <p className="text-slate-400 font-light tracking-widest uppercase text-xs">Step {step} of 3</p>
            </header>

            {/* Step 1: Identity & Race */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in fade-in duration-500">
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-amber-200 font-serif text-lg block mb-2">Name Your Hero</span>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/30 border border-amber-900/50 rounded-lg px-4 py-3 text-lg md:text-xl text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                placeholder="e.g. Thorin"
                                autoFocus
                            />
                        </label>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-sm text-slate-400 leading-relaxed hidden md:block">
                            <p>Your name will be whispered in taverns and shouted on battlefields. Choose wisely.</p>
                        </div>
                    </div>

                    <div>
                        <span className="text-amber-200 font-serif text-lg block mb-4">Choose Lineage</span>
                        <div className="space-y-3">
                            {Object.values(CharacterRace).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRace(r)}
                                    className={`w-full p-3 md:p-4 border rounded-lg flex items-center justify-between transition-all group
                                        ${race === r 
                                            ? 'bg-gradient-to-r from-amber-900/40 to-transparent border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
                                    `}
                                >
                                    <span className={`text-lg font-bold ${race === r ? 'text-amber-100' : 'text-slate-400 group-hover:text-slate-200'}`}>{r}</span>
                                    <span className="text-xs text-slate-500 font-mono bg-black/20 px-2 py-1 rounded">
                                        {r === CharacterRace.HUMAN ? 'All +1' : r === CharacterRace.ELF ? 'DEX +2' : 'CON +2'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Class Selection */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <span className="text-amber-200 font-serif text-lg block mb-6 text-center">Select Your Path</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {Object.values(CharacterClass).map(c => (
                            <button
                                key={c}
                                onClick={() => setCls(c)}
                                className={`relative p-4 md:p-6 border rounded-xl flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 group h-48 md:h-64
                                    ${cls === c 
                                        ? 'bg-slate-800 border-amber-500 shadow-lg scale-105 z-10 ring-1 ring-amber-500/50' 
                                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-500 grayscale hover:grayscale-0'}
                                `}
                            >
                                <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-300">
                                    {c === CharacterClass.FIGHTER && '⚔️'}
                                    {c === CharacterClass.WIZARD && '🔮'}
                                    {c === CharacterClass.ROGUE && '🗡️'}
                                    {c === CharacterClass.CLERIC && '✨'}
                                </div>
                                <div className="text-center">
                                    <span className="text-sm md:text-lg font-serif font-bold block mb-1">{c}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                                        HP: d{c === CharacterClass.WIZARD ? 6 : c === CharacterClass.FIGHTER ? 10 : 8}
                                    </span>
                                </div>
                                
                                {/* Class Description Hint (Desktop only) */}
                                <div className="text-xs text-slate-500 text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                    {c === CharacterClass.FIGHTER && 'Master of martial combat.'}
                                    {c === CharacterClass.WIZARD && 'Scholar of arcane magic.'}
                                    {c === CharacterClass.ROGUE && 'Master of stealth & skill.'}
                                    {c === CharacterClass.CLERIC && 'Priestly champion of a god.'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
                <div className="animate-in zoom-in-95 duration-500">
                    <h3 className="text-xl md:text-2xl font-serif text-amber-200 text-center mb-6 md:mb-8">The Hero's Attributes</h3>
                    <div className="bg-black/40 rounded-xl p-4 md:p-8 border border-slate-800">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                            {(Object.entries(currentStats) as [Ability, number][]).map(([key, val]) => (
                                <div key={key} className="flex flex-col items-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-lg md:text-2xl font-bold text-white shadow-inner mb-2 relative group">
                                        {val}
                                        <div className="absolute -top-2 -right-2 bg-amber-700 text-[10px] w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border border-amber-500 shadow-md">
                                            {getModifier(val) >= 0 ? '+' : ''}{getModifier(val)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <p className="text-base md:text-lg text-slate-300">
                            You are <span className="text-amber-400 font-serif font-bold">{name}</span>, 
                            the <span className="text-slate-200">{race}</span> <span className="text-slate-200">{cls}</span>.
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-8 md:mt-12 flex justify-between items-center border-t border-slate-800 pt-6 md:pt-8">
                <button 
                    onClick={() => setStep(Math.max(1, step-1))} 
                    className={`text-slate-500 hover:text-slate-300 flex items-center gap-2 transition-colors ${step === 1 ? 'invisible' : ''}`}
                >
                    ← Back
                </button>
                
                <div className="flex gap-2">
                    {[1,2,3].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    disabled={!name}
                    className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm md:text-base"
                >
                    {step === 3 ? 'Enter World' : 'Next'} →
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};
