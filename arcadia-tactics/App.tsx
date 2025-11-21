
import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { 
  GameState, TerrainType, HexCell, PositionComponent, Entity, 
  GameLogEntry, CharacterRace, CharacterClass, Attributes,
  VisualComponent, CombatStatsComponent, BattleAction
} from './types';
import { MAP_WIDTH, MAP_HEIGHT, BASE_STATS, ASSETS } from './constants';
import { OverworldMap } from './components/OverworldMap';
import { BattleScene } from './components/BattleScene';
import { CharacterCreation } from './components/CharacterCreation';
import { UIOverlay } from './components/UIOverlay';
import { BattleResultModal } from './components/BattleResultModal';
import { calculateHp, calculateAC, rollD20 } from './services/dndRules';

// --- Mock Map Generation ---
const generateMap = (): HexCell[] => {
  const cells: HexCell[] = [];
  for (let r = 0; r < MAP_HEIGHT; r++) {
    for (let q = 0; q < MAP_WIDTH; q++) {
      const noise = Math.sin(q * 0.5) + Math.cos(r * 0.5);
      let terrain = TerrainType.GRASS;
      let moisture = Math.cos(q * 0.3) + Math.sin(r * 0.3);

      if (noise > 1) terrain = TerrainType.MOUNTAIN;
      else if (noise > 0.5) terrain = TerrainType.FOREST;
      else if (noise < -1) terrain = TerrainType.WATER;
      
      if (moisture > 1 && terrain === TerrainType.GRASS) terrain = TerrainType.SWAMP;
      if (moisture < -1 && terrain === TerrainType.GRASS) terrain = TerrainType.DESERT;
      
      // Add PDI
      if (Math.random() > 0.95 && terrain === TerrainType.GRASS) terrain = TerrainType.VILLAGE;
      if (Math.random() > 0.98 && terrain === TerrainType.MOUNTAIN) terrain = TerrainType.CASTLE;

      cells.push({
        q, r,
        terrain,
        isExplored: false, // Start unexplored (Fog of War)
        isVisible: false,
        hasEncounter: Math.random() > 0.85 // 15% chance of battle
      });
    }
  }
  return cells;
};

const App = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CHARACTER_CREATION);
  
  // Overworld State
  const [mapData, setMapData] = useState<HexCell[]>([]);
  const [playerPos, setPlayerPos] = useState<PositionComponent>({ x: 5, y: 5 });
  
  // Player Data
  const [playerEntity, setPlayerEntity] = useState<Entity & { stats: CombatStatsComponent } | null>(null);
  const [playerClass, setPlayerClass] = useState<CharacterClass | null>(null);
  
  // Battle State
  const [battleEntities, setBattleEntities] = useState<any[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [battleTerrain, setBattleTerrain] = useState<TerrainType>(TerrainType.GRASS);
  const [battleRewards, setBattleRewards] = useState<{xp: number, gold: number}>({ xp: 0, gold: 0 });
  
  // Turn Action State
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [hasActed, setHasActed] = useState(false);
  
  // Selection State for Touch/Mouse (Double tap to confirm)
  const [selectedTile, setSelectedTile] = useState<{x: number, z: number} | null>(null);

  // Logs
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const addLog = (message: string, type: GameLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(), message, type, timestamp: Date.now() }]);
  };

  // --- Helpers: Valid Moves Calculator ---
  const validMoves = useMemo(() => {
      if (gameState !== GameState.BATTLE_TACTICAL || !selectedAction || selectedAction !== BattleAction.MOVE || hasMoved) {
          return [];
      }
      const player = battleEntities.find(e => e.id === 'player');
      if (!player) return [];

      const moves: PositionComponent[] = [];
      // Calculate speed in tiles (5ft per tile)
      const speedInTiles = Math.floor(player.stats.speed / 5);

      for (let x = 0; x < 8; x++) {
          for (let z = 0; z < 8; z++) {
              // Distance Check (Chebyshev distance for grid movement usually allows diagonals, 
              // but strict D&D grid is sometimes 5-10-5. Here we use simple max(dx,dz) = 1 tile cost)
              const dx = Math.abs(player.position.x - x);
              const dz = Math.abs(player.position.y - z);
              const dist = Math.max(dx, dz);
              
              // Occupied Check (Player collision prevention)
              const occupied = battleEntities.some(e => e.position.x === x && e.position.y === z && e.id !== 'player');
              
              if (dist <= speedInTiles && !occupied) {
                  moves.push({ x, y: z });
              }
          }
      }
      return moves;
  }, [gameState, selectedAction, hasMoved, battleEntities]);

  // --- Helpers: Valid Targets Calculator ---
  const validTargets = useMemo(() => {
      if (gameState !== GameState.BATTLE_TACTICAL || !selectedAction || hasActed) {
          return [];
      }
      
      // Determine range based on action
      let range = 0;
      if (selectedAction === BattleAction.ATTACK) range = 1; // Melee 5ft
      else if (selectedAction === BattleAction.MAGIC) range = 6; // Spell 30ft
      else return [];

      const player = battleEntities.find(e => e.id === 'player');
      if (!player) return [];

      return battleEntities
        .filter(e => e.type === 'ENEMY')
        .filter(e => {
            const dx = Math.abs(player.position.x - e.position.x);
            const dz = Math.abs(player.position.y - e.position.y);
            // Simple line of sight / range check
            return Math.max(dx, dz) <= range;
        })
        .map(e => ({ x: e.position.x, y: e.position.y }));

  }, [gameState, selectedAction, hasActed, battleEntities]);


  // --- Logic: Overworld Movement & Fog ---
  const updateFogOfWar = (q: number, r: number, currentMap: HexCell[]) => {
      const newMap = currentMap.map(cell => {
          const dist = (Math.abs(cell.q - q) + Math.abs(cell.q + cell.r - q - r) + Math.abs(cell.r - r)) / 2;
          if (dist <= 2) {
              return { ...cell, isExplored: true, isVisible: true };
          }
          return { ...cell, isVisible: false };
      });
      setMapData(newMap);
      return newMap;
  };

  // --- Logic: Character Created ---
  const handleCharacterComplete = (name: string, race: CharacterRace, cls: CharacterClass, stats: Attributes) => {
    const maxHp = calculateHp(1, stats.CON, cls === CharacterClass.WIZARD ? 6 : cls === CharacterClass.FIGHTER ? 10 : 8);
    
    const pEntity = {
        id: 'player',
        name,
        type: 'PLAYER',
        stats: {
            hp: maxHp,
            maxHp,
            ac: calculateAC(stats.DEX, 10, false),
            initiativeBonus: Math.floor((stats.DEX - 10) / 2),
            speed: 30, // Standard 30ft speed
            attributes: stats
        },
        visual: { 
            color: '#3b82f6', 
            modelType: 'billboard',
            spriteUrl: ASSETS.UNITS.PLAYER 
        },
        position: { x: 5, y: 5 }
    };
    
    setPlayerEntity(pEntity);
    setPlayerClass(cls);
    
    const initialMap = generateMap();
    updateFogOfWar(5, 5, initialMap);
    
    setGameState(GameState.OVERWORLD);
    addLog(`Welcome to Arcadia, ${name} the ${race} ${cls}. Explore the map to begin.`);
  };

  const handleOverworldMove = (q: number, r: number) => {
      const dist = (Math.abs(playerPos.x - q) + Math.abs(playerPos.x + playerPos.y - q - r) + Math.abs(playerPos.y - r)) / 2;
      if (dist > 1) {
          addLog("Too far to travel in one step.", "info");
          return;
      }

      const targetCell = mapData.find(c => c.q === q && c.r === r);
      if (!targetCell) return;

      setPlayerPos({ x: q, y: r });
      const updatedMap = updateFogOfWar(q, r, mapData);
      
      if (targetCell.hasEncounter && !targetCell.terrain.includes('castle') && !targetCell.terrain.includes('village')) {
          startBattle(targetCell.terrain);
          setMapData(updatedMap.map(c => c === targetCell ? { ...c, hasEncounter: false } : c));
      }
  };

  const startBattle = (terrain: TerrainType) => {
      if (!playerEntity) return;
      addLog("Enemies spotted! Rolling initiative...", "combat");
      setBattleTerrain(terrain);
      
      setHasMoved(false);
      setHasActed(false);
      setSelectedAction(null);
      setSelectedTile(null);
      
      const playerBattlePos = { x: 3, y: 7 };
      const enemyBattlePos = { x: 4, y: 2 };
      
      const enemy: any = {
          id: 'goblin_1',
          name: 'Goblin Scout',
          type: 'ENEMY',
          stats: {
              hp: 7, maxHp: 7, ac: 15, initiativeBonus: 2, speed: 30,
              attributes: { STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8 }
          },
          visual: { 
              color: '#ef4444', 
              modelType: 'billboard',
              spriteUrl: ASSETS.UNITS.GOBLIN
          },
          position: enemyBattlePos
      };

      const playerBattleEnt = { ...playerEntity, position: playerBattlePos };
      
      const pInit = rollD20().result + playerEntity.stats.initiativeBonus;
      const eInit = rollD20().result + enemy.stats.initiativeBonus;
      addLog(`Initiative: You(${pInit}) vs Goblin(${eInit})`, "roll");

      const entities = [playerBattleEnt, enemy];
      const order = pInit >= eInit ? ['player', 'goblin_1'] : ['goblin_1', 'player'];
      
      setBattleEntities(entities);
      setTurnOrder(order);
      setCurrentTurnIndex(0);
      setGameState(GameState.BATTLE_TACTICAL);
      
      if (order[0] !== 'player') {
          setTimeout(() => enemyTurn(order[0]), 1000);
      } else {
          setSelectedAction(BattleAction.MOVE);
      }
  };

  const handleActionSelect = (action: BattleAction) => {
      if (action === BattleAction.WAIT) {
          nextTurn();
          return;
      }
      
      setSelectedTile(null); // Reset tile selection when changing modes

      if (action === BattleAction.ITEM && !hasActed) {
          addLog("You drink a Potion of Healing.", "narrative");
          const heal = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + 2;
          setBattleEntities(prev => prev.map(e => {
              if (e.id === 'player') {
                  const newHp = Math.min(e.stats.maxHp, e.stats.hp + heal);
                  addLog(`Recovered ${heal} HP.`, "roll");
                  return { ...e, stats: { ...e.stats, hp: newHp }};
              }
              return e;
          }));
          setHasActed(true);
          setSelectedAction(null);
          return;
      }

      setSelectedAction(action);
  };

  const handleBattleTileClick = (x: number, z: number) => {
      const currentId = turnOrder[currentTurnIndex];
      if (currentId !== 'player') return;

      // --- Tap to Select Logic ---
      if (!selectedTile || selectedTile.x !== x || selectedTile.z !== z) {
          // First Tap: Just select visually
          setSelectedTile({ x, z });
          return; // Wait for confirmation tap
      }
      
      // Second Tap: Execute Logic
      const targetEnt = battleEntities.find(e => e.position.x === x && e.position.y === z);

      // --- MOVE ACTION ---
      if (selectedAction === BattleAction.MOVE) {
          if (hasMoved) {
              addLog("Already moved.", "info"); return;
          }
          
          // Validation
          const isValid = validMoves.some(m => m.x === x && m.y === z);
          
          if (!isValid) {
               if (targetEnt && targetEnt.id === 'player') {
                   addLog("You are already there.", "info");
               } else if (targetEnt) {
                   addLog("Destination is occupied.", "info");
               } else {
                   addLog("Too far to move.", "info");
               }
               return;
          }

          setBattleEntities(prev => prev.map(e => e.id === 'player' ? { ...e, position: { x, y: z } } : e));
          setHasMoved(true);
          setSelectedAction(null);
          setSelectedTile(null);
      } 
      
      // --- ATTACK or MAGIC ACTION ---
      else if (selectedAction === BattleAction.ATTACK || selectedAction === BattleAction.MAGIC) {
          if (hasActed) { addLog("Already acted.", "info"); return; }
          
          const isValid = validTargets.some(t => t.x === x && t.y === z);

          if (!isValid) {
              addLog("Invalid target.", "info");
              return;
          }
          
          if (targetEnt) {
              if (selectedAction === BattleAction.ATTACK) {
                  performAttack(targetEnt);
              } else {
                  performMagic(targetEnt);
              }
          }
          setSelectedTile(null);
      }
  };

  const performAttack = (targetEnt: any) => {
      const { result, raw } = rollD20();
      const hitRoll = result + 4; // Proficiency + STR/DEX mock
      addLog(`Attack: Rolled ${raw[0]} + 4 = ${hitRoll} vs AC ${targetEnt.stats.ac}`, "combat");
      
      if (hitRoll >= targetEnt.stats.ac) {
         const dmg = Math.floor(Math.random() * 8) + 3; 
         addLog(`Hit! Dealt ${dmg} damage.`, "combat");
         applyDamage(targetEnt.id, dmg);
      } else {
          addLog("Miss!", "combat");
      }
      setHasActed(true);
      setSelectedAction(null);
  };

  const performMagic = (targetEnt: any) => {
      addLog(`You cast a spell at ${targetEnt.name}!`, "combat");
      // Magic Missile style - auto hit for simplicity in prototype
      const dmg = Math.floor(Math.random() * 4) + 1 + Math.floor(Math.random() * 4) + 1;
      addLog(`Arcane energy deals ${dmg} damage!`, "combat");
      applyDamage(targetEnt.id, dmg);
      setHasActed(true);
      setSelectedAction(null);
  };

  const applyDamage = (targetId: string, amount: number) => {
     const newEntities = battleEntities.map(e => {
         if (e.id === targetId) {
             const remaining = e.stats.hp - amount;
             return { ...e, stats: { ...e.stats, hp: remaining } };
         }
         return e;
     });
     setBattleEntities(newEntities);

     // Check for Victory
     const remainingEnemies = newEntities.filter(e => e.type === 'ENEMY' && e.stats.hp > 0);
     if (remainingEnemies.length === 0) {
         addLog("Enemy defeated!", "narrative");
         // Delay slightly to show the final hit, then trigger victory
         setTimeout(() => {
            setBattleRewards({ xp: 50, gold: 10 + Math.floor(Math.random() * 10) });
            setGameState(GameState.BATTLE_VICTORY);
         }, 1000);
     }
  };

  const nextTurn = () => {
      if (gameState !== GameState.BATTLE_TACTICAL) return;

      const nextIdx = (currentTurnIndex + 1) % turnOrder.length;
      setCurrentTurnIndex(nextIdx);
      setSelectedTile(null);
      
      const nextId = turnOrder[nextIdx];
      if (nextId === 'player') {
          setHasMoved(false);
          setHasActed(false);
          setSelectedAction(BattleAction.MOVE);
          addLog("Your turn.", "info");
      } else {
          setSelectedAction(null);
          setTimeout(() => enemyTurn(nextId), 1000);
      }
  };

  const enemyTurn = (enemyId: string) => {
      // Need to fetch latest state
      setBattleEntities(currentEntities => {
          const me = currentEntities.find(e => e.id === enemyId);
          const player = currentEntities.find(e => e.id === 'player');
          
          // Sanity check: if enemy is dead or battle over, do nothing
          if (!me || me.stats.hp <= 0 || gameState !== GameState.BATTLE_TACTICAL) return currentEntities;
          if (!player) return currentEntities;

          addLog("Enemy is acting...", "combat");

          const dx = Math.abs(me.position.x - player.position.x);
          const dz = Math.abs(me.position.y - player.position.y);
          
          // ATTACK LOGIC
          if (dx <= 1 && dz <= 1) {
              const { result } = rollD20();
              if (result + 4 >= player.stats.ac) {
                  const dmg = Math.floor(Math.random() * 6) + 2;
                  addLog(`Enemy hits for ${dmg} damage!`, "combat");
                  
                  // Apply damage to player immediately
                  const currentHp = player.stats.hp - dmg;
                  
                  if (currentHp <= 0) {
                      // DEFEAT
                      setTimeout(() => setGameState(GameState.BATTLE_DEFEAT), 1000);
                  } else {
                      setTimeout(() => nextTurn(), 1500);
                  }

                  return currentEntities.map(e => 
                      e.id === 'player' ? { ...e, stats: {...e.stats, hp: currentHp}} : e
                  );
              } else {
                  addLog("Enemy attacks but misses!", "combat");
                  setTimeout(() => nextTurn(), 1500);
                  return currentEntities;
              }
          } 
          
          // MOVE LOGIC - WITH OBSTACLE AVOIDANCE
          else {
              let newX = me.position.x;
              let newZ = me.position.y;
              
              // Determine desired direction
              const dirX = me.position.x < player.position.x ? 1 : me.position.x > player.position.x ? -1 : 0;
              const dirZ = me.position.y < player.position.y ? 1 : me.position.y > player.position.y ? -1 : 0;
              
              const tryMove = (tx: number, tz: number) => {
                  return !currentEntities.some(e => e.position.x === tx && e.position.y === tz && e.id !== enemyId);
              };

              // Try diagonal/direct
              if (tryMove(me.position.x + dirX, me.position.y + dirZ)) {
                  newX += dirX;
                  newZ += dirZ;
              } 
              // Try X only (slide)
              else if (dirX !== 0 && tryMove(me.position.x + dirX, me.position.y)) {
                  newX += dirX;
              }
              // Try Z only (slide)
              else if (dirZ !== 0 && tryMove(me.position.x, me.position.y + dirZ)) {
                  newZ += dirZ;
              }
              // Else stuck

              if (newX !== me.position.x || newZ !== me.position.y) {
                 addLog("Enemy moves closer.", "info");
                 const updatedEntities = currentEntities.map(e => 
                    e.id === enemyId ? { ...e, position: { x: newX, y: newZ } } : e
                 );
                 setTimeout(() => nextTurn(), 1500);
                 return updatedEntities;
              } else {
                 addLog("Enemy path blocked.", "info");
                 setTimeout(() => nextTurn(), 1500);
                 return currentEntities;
              }
          }
      });
  };

  const handleVictoryContinue = () => {
      // In a real game, we'd apply XP/Gold here
      if (playerEntity) {
          setPlayerEntity({
              ...playerEntity,
              stats: { ...playerEntity.stats } // Could heal partially or add XP here
          });
      }
      addLog(`Battle won! Earned ${battleRewards.xp} XP and ${battleRewards.gold} Gold.`, "narrative");
      setGameState(GameState.OVERWORLD);
  };

  const handleDefeatRestart = () => {
      // Restart the same battle
      startBattle(battleTerrain);
  };
  
  const handleQuit = () => {
      setGameState(GameState.CHARACTER_CREATION);
      setMapData([]);
      setLogs([]);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {gameState === GameState.CHARACTER_CREATION && (
          <CharacterCreation onComplete={handleCharacterComplete} />
      )}

      {gameState === GameState.OVERWORLD && (
          <>
            <OverworldMap 
                mapData={mapData} 
                playerPos={playerPos} 
                onMove={handleOverworldMove} 
            />
            <UIOverlay 
                logs={logs} 
                playerStats={playerEntity?.stats}
            />
          </>
      )}

      {(gameState === GameState.BATTLE_TACTICAL || gameState === GameState.BATTLE_VICTORY || gameState === GameState.BATTLE_DEFEAT) && (
          <Suspense fallback={
              <div className="flex items-center justify-center h-full w-full text-amber-400 font-serif animate-pulse">
                  Preparing Battle Diorama...
              </div>
          }>
            <BattleScene 
                entities={battleEntities} 
                terrainType={battleTerrain}
                currentTurnEntityId={turnOrder[currentTurnIndex]}
                onTileClick={handleBattleTileClick}
                validMoves={validMoves}
                validTargets={validTargets}
            />
            <UIOverlay 
                logs={logs} 
                playerStats={battleEntities.find(e => e.id === 'player')?.stats}
                turnOrder={turnOrder}
                currentTurn={turnOrder[currentTurnIndex]}
                onActionSelect={handleActionSelect}
                selectedAction={selectedAction}
                hasMoved={hasMoved}
                hasActed={hasActed}
            />

            {(gameState === GameState.BATTLE_VICTORY || gameState === GameState.BATTLE_DEFEAT) && (
                <BattleResultModal 
                    type={gameState === GameState.BATTLE_VICTORY ? 'victory' : 'defeat'}
                    rewards={gameState === GameState.BATTLE_VICTORY ? battleRewards : undefined}
                    onContinue={handleVictoryContinue}
                    onRestart={handleDefeatRestart}
                    onQuit={handleQuit}
                />
            )}
          </Suspense>
      )}
    </div>
  );
};

export default App;
