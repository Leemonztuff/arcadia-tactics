
import { TerrainType, CharacterClass, CharacterRace, Ability } from './types';

export const HEX_SIZE = 40;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 15;

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.GRASS]: '#4ade80', // green-400
  [TerrainType.FOREST]: '#166534', // green-800
  [TerrainType.MOUNTAIN]: '#57534e', // stone-600
  [TerrainType.WATER]: '#3b82f6', // blue-500
  [TerrainType.CASTLE]: '#94a3b8', // slate-400
  [TerrainType.VILLAGE]: '#d97706', // amber-600
  [TerrainType.DESERT]: '#eab308', // yellow-600
  [TerrainType.SWAMP]: '#365314', // lime-900
};

export const BASE_STATS: Record<CharacterClass, Record<Ability, number>> = {
  [CharacterClass.FIGHTER]: { STR: 15, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 10 },
  [CharacterClass.WIZARD]:  { STR: 8,  DEX: 12, CON: 12, INT: 15, WIS: 13, CHA: 10 },
  [CharacterClass.ROGUE]:   { STR: 10, DEX: 15, CON: 12, INT: 12, WIS: 10, CHA: 12 },
  [CharacterClass.CLERIC]:  { STR: 12, DEX: 10, CON: 13, INT: 10, WIS: 15, CHA: 12 },
};

export const RACE_BONUS: Record<CharacterRace, Partial<Record<Ability, number>>> = {
  [CharacterRace.HUMAN]: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
  [CharacterRace.ELF]: { DEX: 2, INT: 1 },
  [CharacterRace.DWARF]: { CON: 2, STR: 2 }, // Mountain Dwarf variant
};

export const DICE_ICONS = {
  d20: "🎲",
};

// Asset URLs pointing to Wesnoth GitHub Raw Content
const WESNOTH_BASE_URL = "https://raw.githubusercontent.com/wesnoth/wesnoth/master/data/core/images";
// Using Poudingue/Vanilla-Normals-Renewed for textures as requested
const MC_BASE_URL = "https://raw.githubusercontent.com/Poudingue/Vanilla-Normals-Renewed/master/assets/minecraft/textures/block";

export const ASSETS: {
    UNITS: { [key: string]: string },
    TERRAIN: Partial<Record<TerrainType, string>>,
    BLOCK_TEXTURES: Partial<Record<TerrainType, string>>
} = {
    UNITS: {
        PLAYER: `${WESNOTH_BASE_URL}/units/human-loyalists/sergeant.png`,
        GOBLIN: `${WESNOTH_BASE_URL}/units/goblins/spearman.png`,
    },
    // 2D Overworld Textures (Wesnoth Hexes)
    TERRAIN: {
        [TerrainType.GRASS]: `${WESNOTH_BASE_URL}/terrain/grass/green.png`, 
        [TerrainType.FOREST]: `${WESNOTH_BASE_URL}/terrain/grass/green.png`, // Forest is overlay on grass
        [TerrainType.WATER]: `${WESNOTH_BASE_URL}/terrain/water/ocean.png`,
        [TerrainType.MOUNTAIN]: `${WESNOTH_BASE_URL}/terrain/mountains/basic.png`,
        [TerrainType.VILLAGE]: `${WESNOTH_BASE_URL}/terrain/flat/dirt.png`, // Using flat/dirt for village base
        [TerrainType.CASTLE]: `${WESNOTH_BASE_URL}/terrain/cave/floor.png`, // Using stony floor for castle
        [TerrainType.DESERT]: `${WESNOTH_BASE_URL}/terrain/sand/desert.png`,
        [TerrainType.SWAMP]: `${WESNOTH_BASE_URL}/terrain/swamp/water.png`,
    },
    // 3D Battle Textures (Minecraft Standard Names)
    BLOCK_TEXTURES: {
        [TerrainType.GRASS]: `${MC_BASE_URL}/grass_block_top.png`,
        [TerrainType.FOREST]: `${MC_BASE_URL}/grass_block_top.png`, 
        [TerrainType.MOUNTAIN]: `${MC_BASE_URL}/stone.png`,
        [TerrainType.WATER]: `${MC_BASE_URL}/blue_concrete.png`, // Water texture fallback
        [TerrainType.CASTLE]: `${MC_BASE_URL}/stone_bricks.png`,
        [TerrainType.VILLAGE]: `${MC_BASE_URL}/oak_planks.png`,
        [TerrainType.DESERT]: `${MC_BASE_URL}/sand.png`,
        [TerrainType.SWAMP]: `${MC_BASE_URL}/grass_block_top.png`,
    }
};
