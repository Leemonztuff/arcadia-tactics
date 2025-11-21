
export enum GameState {
  LOGIN,
  CHARACTER_CREATION,
  OVERWORLD,
  BATTLE_INIT,
  BATTLE_TACTICAL,
  BATTLE_RESOLUTION,
  BATTLE_VICTORY,
  BATTLE_DEFEAT
}

export enum TerrainType {
  GRASS = 'grass',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  WATER = 'water',
  CASTLE = 'castle',
  VILLAGE = 'village',
  DESERT = 'desert',
  SWAMP = 'swamp'
}

// --- D&D 5E Stats ---

export enum Ability {
  STR = 'STR',
  DEX = 'DEX',
  CON = 'CON',
  INT = 'INT',
  WIS = 'WIS',
  CHA = 'CHA'
}

export interface Attributes {
  [Ability.STR]: number;
  [Ability.DEX]: number;
  [Ability.CON]: number;
  [Ability.INT]: number;
  [Ability.WIS]: number;
  [Ability.CHA]: number;
}

export enum CharacterClass {
  FIGHTER = 'Fighter',
  WIZARD = 'Wizard',
  ROGUE = 'Rogue',
  CLERIC = 'Cleric'
}

export enum CharacterRace {
  HUMAN = 'Human',
  ELF = 'Elf',
  DWARF = 'Dwarf'
}

export enum BattleAction {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  MAGIC = 'MAGIC',
  ITEM = 'ITEM',
  WAIT = 'WAIT'
}

// --- ECS Components ---

export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'ENEMY' | 'NPC';
}

export interface PositionComponent {
  x: number; // Hex X or 3D Grid X
  y: number; // Hex Y or 3D Grid Z
  z?: number; // Height for 3D
}

export interface CombatStatsComponent {
  hp: number;
  maxHp: number;
  ac: number;
  initiativeBonus: number;
  speed: number; // in ft (e.g., 30)
  attributes: Attributes;
}

export interface VisualComponent {
  spriteUrl?: string;
  color: string;
  modelType: 'billboard' | 'voxel';
}

// --- Game World Data ---

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  isExplored: boolean;
  isVisible: boolean; // Fog of war
  hasEncounter?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'narrative' | 'roll';
  timestamp: number;
}
