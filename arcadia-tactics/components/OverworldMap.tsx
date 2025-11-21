
import React, { useMemo } from 'react';
import { HexCell, TerrainType, PositionComponent } from '../types';
import { HEX_SIZE, TERRAIN_COLORS } from '../constants';
import { ASSETS } from '../constants';

interface OverworldMapProps {
  mapData: HexCell[];
  playerPos: PositionComponent;
  onMove: (q: number, r: number) => void;
}

// Hex math helpers
const hexToPixel = (q: number, r: number) => {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
};

interface HexagonProps {
  cell: HexCell;
  onClick: () => void;
  isPlayer: boolean;
}

const Hexagon: React.FC<HexagonProps> = ({ cell, onClick, isPlayer }) => {
  const { x, y } = hexToPixel(cell.q, cell.r);
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = (Math.PI / 180) * angle_deg;
    points.push(`${x + HEX_SIZE * Math.cos(angle_rad)},${y + HEX_SIZE * Math.sin(angle_rad)}`);
  }

  let terrainSymbol = "";
  // Display symbols for all explored terrain, dimmed if not currently visible
  if (cell.isExplored) {
    switch(cell.terrain) {
        case TerrainType.FOREST: terrainSymbol = "🌲"; break;
        case TerrainType.MOUNTAIN: terrainSymbol = "⛰️"; break;
        case TerrainType.VILLAGE: terrainSymbol = "🏠"; break;
        case TerrainType.CASTLE: terrainSymbol = "🏰"; break;
        case TerrainType.WATER: terrainSymbol = "🌊"; break;
        case TerrainType.DESERT: terrainSymbol = "🌵"; break;
        case TerrainType.SWAMP: terrainSymbol = "🐸"; break;
    }
  }

  const hasTexture = !!ASSETS.TERRAIN[cell.terrain];

  return (
    <g onClick={onClick} className={`cursor-pointer transition-opacity ${cell.isVisible ? 'hover:opacity-90' : ''}`}>
      {/* Base Color Layer (Fallback or Base) */}
      <polygon
        points={points.join(' ')}
        fill={cell.isExplored ? TERRAIN_COLORS[cell.terrain] : '#020617'}
        stroke={cell.isExplored ? "#334155" : "#0f172a"}
        strokeWidth="1"
      />
      
      {/* Texture Layer (if available and explored) */}
      {cell.isExplored && hasTexture && (
        <polygon
            points={points.join(' ')}
            fill={`url(#terrain-${cell.terrain})`}
            style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Terrain Symbol */}
      {cell.isExplored && terrainSymbol && (
          <text 
            x={x} 
            y={y} 
            textAnchor="middle" 
            dy=".3em" 
            fontSize="16" 
            pointerEvents="none" 
            className={`drop-shadow-md filter ${!cell.isVisible ? 'opacity-40 grayscale' : ''}`}
          >
              {terrainSymbol}
          </text>
      )}
      
      {/* Player Icon */}
      {isPlayer && (
        <g transform={`translate(${x}, ${y})`}>
            <circle r={HEX_SIZE * 0.4} fill="rgba(0,0,0,0.5)" />
            <image 
                href={ASSETS.UNITS.PLAYER} 
                x={-HEX_SIZE * 0.4} 
                y={-HEX_SIZE * 0.4} 
                height={HEX_SIZE * 0.8} 
                width={HEX_SIZE * 0.8} 
                className="drop-shadow-lg"
            />
        </g>
      )}

      {/* Fog of War Overlay (Explored but not visible) */}
      {!cell.isVisible && cell.isExplored && (
          <polygon points={points.join(' ')} fill="#0f172a" fillOpacity="0.7" pointerEvents="none" />
      )}

      {/* Unexplored Void Overlay */}
      {!cell.isExplored && (
           <polygon points={points.join(' ')} fill="#000000" fillOpacity="0.5" stroke="#1e293b" strokeWidth="0.5" pointerEvents="none" />
      )}
    </g>
  );
};

export const OverworldMap: React.FC<OverworldMapProps> = ({ mapData, playerPos, onMove }) => {
  // Determine SVG bounds
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    mapData.forEach(c => {
      const { x, y } = hexToPixel(c.q, c.r);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    return { minX: minX - HEX_SIZE, maxX: maxX + HEX_SIZE, minY: minY - HEX_SIZE, maxY: maxY + HEX_SIZE };
  }, [mapData]);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  // Unique terrain types for pattern generation
  const terrainTypes = Object.values(TerrainType);

  return (
    <div className="w-full h-full overflow-auto bg-slate-950 relative">
        <div className="absolute top-4 left-4 bg-slate-800/90 p-3 rounded-lg border border-amber-600/30 z-10 pointer-events-none shadow-xl">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Region</p>
            <p className="font-bold text-amber-400 text-lg font-serif">Forest of Whispers</p>
        </div>

        <svg 
            width={Math.max(width, window.innerWidth)} 
            height={Math.max(height, window.innerHeight)}
            viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
            className="block mx-auto my-8"
        >
            <defs>
                {terrainTypes.map(type => (
                    ASSETS.TERRAIN[type] ? (
                        <pattern 
                            key={type} 
                            id={`terrain-${type}`} 
                            patternUnits="objectBoundingBox" 
                            width="1" 
                            height="1"
                            preserveAspectRatio="xMidYMid slice"
                        >
                            <image 
                                href={ASSETS.TERRAIN[type]} 
                                x="0" 
                                y="0" 
                                width="100%" 
                                height="100%" 
                                preserveAspectRatio="none"
                            />
                        </pattern>
                    ) : null
                ))}
            </defs>
            {mapData.map((cell) => (
            <Hexagon
                key={`${cell.q},${cell.r}`}
                cell={cell}
                isPlayer={cell.q === playerPos.x && cell.r === playerPos.y}
                onClick={() => onMove(cell.q, cell.r)}
            />
            ))}
        </svg>
    </div>
  );
};
