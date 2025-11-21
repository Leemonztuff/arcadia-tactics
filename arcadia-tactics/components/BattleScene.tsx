
import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Entity, PositionComponent, VisualComponent, TerrainType, CombatStatsComponent } from '../types';
import { TERRAIN_COLORS, ASSETS } from '../constants';

interface BillboardUnitProps { 
  position: [number, number, number];
  color: string;
  spriteUrl?: string;
  isCurrentTurn: boolean;
  hp: number;
  maxHp: number;
}

// --- Animated Selection Ring ---
const SelectionRing = () => {
    const ringRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.01;
            const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
            ringRef.current.scale.set(scale, scale, 1);
        }
    });

    return (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
            <ringGeometry args={[0.35, 0.45, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} toneMapped={false} />
        </mesh>
    );
};

// --- 3D Cursor for Touch/Mouse Feedback ---
const CursorSelector = ({ position, color = 'white', visible }: { position: [number, number, number], color?: string, visible: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (ref.current) {
            const y = 0.1 + Math.sin(state.clock.elapsedTime * 5) * 0.05;
            ref.current.position.y = y;
        }
    });

    if (!visible) return null;

    return (
        <group position={[position[0], 0, position[2]]} ref={ref}>
             {/* Corners or Frame */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.9, 0.9]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 0.1, 1]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

// --- Billboarding Unit with Smooth Movement ---
const BillboardUnit: React.FC<BillboardUnitProps> = ({ 
  position, 
  color, 
  spriteUrl,
  isCurrentTurn,
  hp,
  maxHp
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const hpPercent = maxHp > 0 ? hp / maxHp : 0;
  
  const targetPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  useMemo(() => {
      targetPos.current.set(position[0], position[1], position[2]);
  }, [position]);

  useFrame(({ camera }, delta) => {
      if (groupRef.current) {
          groupRef.current.quaternion.copy(camera.quaternion);
          groupRef.current.position.lerp(targetPos.current, delta * 8);
      }
  });

  return (
    <group ref={groupRef} position={position}>
        {isCurrentTurn && <SelectionRing />}
        
        <group>
           <Suspense fallback={
               <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[1, 1]} />
                  <meshStandardMaterial color={color} />
               </mesh>
           }>
               <UnitSpritePlane spriteUrl={spriteUrl} color={color} />
           </Suspense>
            
            <group position={[0, 0.7, 0]}>
                <mesh position={[0, 0, -0.01]}>
                     <planeGeometry args={[0.82, 0.12]} />
                     <meshBasicMaterial color="#0f172a" opacity={0.8} transparent />
                </mesh>
                <mesh position={[0, 0, -0.02]}>
                     <planeGeometry args={[0.85, 0.15]} />
                     <meshBasicMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-0.4 + (0.8 * hpPercent) / 2, 0, 0]}>
                    <planeGeometry args={[0.8 * hpPercent, 0.1]} />
                    <meshBasicMaterial color={hpPercent > 0.5 ? "#22c55e" : "#ef4444"} toneMapped={false} />
                </mesh>
            </group>
        </group>
    </group>
  );
};

const UnitSpritePlane = ({ spriteUrl, color }: { spriteUrl?: string, color: string }) => {
    const texture = spriteUrl ? useLoader(THREE.TextureLoader, spriteUrl) : null;
    
    useMemo(() => {
        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture]);

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial 
                map={texture || undefined} 
                transparent={true}
                alphaTest={0.5} 
                color={texture ? 'white' : color} 
                side={THREE.DoubleSide}
                roughness={1} 
                emissive={texture ? 'black' : color}
                emissiveIntensity={0.1}
            />
        </mesh>
    );
}

interface TextureErrorBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

class TextureErrorBoundary extends React.Component<TextureErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  render() {
    const props = (this as any).props as TextureErrorBoundaryProps;
    if (this.state.hasError) return props.fallback;
    return props.children;
  }
}

const TexturedVoxelFace = ({ url, color, overlayColor }: { url: string, color: string, overlayColor?: string }) => {
    const texture = useLoader(THREE.TextureLoader, url);
    
    useMemo(() => {
        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture]);

    return (
        <meshStandardMaterial 
            attach="material-2" 
            map={texture} 
            color={overlayColor || color} // Tint with overlay color if present
            transparent={false}
            roughness={0.8}
            metalness={0.1}
            emissive={overlayColor || 'black'}
            emissiveIntensity={overlayColor ? 0.3 : 0}
        />
    );
};

const VoxelBlock = ({ 
    position, 
    color, 
    height = 0.5, 
    textureUrl, 
    highlightColor 
}: { 
    position: [number, number, number], 
    color: string, 
    height?: number, 
    textureUrl?: string,
    highlightColor?: string // 'green' | 'red' | undefined
}) => {
    
    // Determine tint based on highlight
    const overlayColor = highlightColor === 'green' ? '#4ade80' : highlightColor === 'red' ? '#f87171' : undefined;

    return (
        <mesh position={[position[0], -height/2, position[2]]} castShadow receiveShadow>
            <boxGeometry args={[1, height, 1]} /> 
            
            <meshStandardMaterial attach="material-0" color="#3e2723" roughness={1} />
            <meshStandardMaterial attach="material-1" color="#3e2723" roughness={1} />
            
            {textureUrl ? (
                <TextureErrorBoundary fallback={<meshStandardMaterial attach="material-2" color={overlayColor || color} />}>
                    <Suspense fallback={<meshStandardMaterial attach="material-2" color={overlayColor || color} />}>
                        <TexturedVoxelFace url={textureUrl} color={color} overlayColor={overlayColor} />
                    </Suspense>
                </TextureErrorBoundary>
            ) : (
                <meshStandardMaterial 
                    attach="material-2" 
                    color={overlayColor || color} 
                    emissive={overlayColor || 'black'}
                    emissiveIntensity={overlayColor ? 0.2 : 0}
                />
            )}

            <meshStandardMaterial attach="material-3" color="#3e2723" roughness={1} />
            <meshStandardMaterial attach="material-4" color="#3e2723" roughness={1} />
            <meshStandardMaterial attach="material-5" color="#3e2723" roughness={1} />
        </mesh>
    );
};

interface BattleSceneProps {
  entities: (Entity & { position: PositionComponent, visual: VisualComponent, stats: CombatStatsComponent })[];
  terrainType: TerrainType;
  currentTurnEntityId: string;
  onTileClick: (x: number, z: number) => void;
  validMoves: PositionComponent[]; // New: For highlighting
  validTargets: PositionComponent[]; // New: For highlighting
}

const BattleSceneContent: React.FC<BattleSceneProps> = ({ 
    entities, 
    terrainType, 
    currentTurnEntityId, 
    onTileClick,
    validMoves,
    validTargets
}) => {
  const controlsRef = useRef<any>(null);
  const [hoveredTile, setHoveredTile] = useState<{x: number, z: number} | null>(null);
  
  const gridData = useMemo(() => {
    const grid = [];
    const textureUrl = ASSETS.BLOCK_TEXTURES[terrainType];
    
    for(let x = 0; x < 8; x++) {
        for(let z = 0; z < 8; z++) {
            let height = 0.5;
            let color = TERRAIN_COLORS[terrainType];
            
            if (terrainType === TerrainType.MOUNTAIN && Math.random() > 0.7) height = 1.5;
            if (terrainType === TerrainType.FOREST && Math.random() > 0.8) height = 1.0;
            if (terrainType === TerrainType.DESERT) height = 0.5 + Math.sin(x * 0.5 + z * 0.5) * 0.3;
            if (terrainType === TerrainType.SWAMP) height = 0.3;

            grid.push({ x, z, height, color, textureUrl });
        }
    }
    return grid;
  }, [terrainType]);

  const activeEntity = entities.find(e => e.id === currentTurnEntityId);
  
  useFrame((state, delta) => {
    if (controlsRef.current) {
        const currentTarget = controlsRef.current.target;
        let destination = new THREE.Vector3(3.5, 0, 3.5);
        if (activeEntity) {
            destination.set(activeEntity.position.x, 0.5, activeEntity.position.y);
        }
        currentTarget.lerp(destination, delta * 4.0);
        controlsRef.current.update();
    }
  });

  return (
    <>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 5, 18]} /> 
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="night" />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
            position={[10, 15, 10]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
            shadow-bias={-0.0001}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#3b82f6" />
        
        <OrbitControls 
            ref={controlsRef}
            target={[3.5, 0, 3.5]} 
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2.0}
            maxDistance={10} 
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.1}
        />

        {/* Cursor for visual feedback */}
        {hoveredTile && (
            <CursorSelector 
                position={[hoveredTile.x, 0, hoveredTile.z]} 
                visible={true} 
                color={
                    validTargets.some(t => t.x === hoveredTile.x && t.y === hoveredTile.z) ? '#f87171' :
                    validMoves.some(t => t.x === hoveredTile.x && t.y === hoveredTile.z) ? '#4ade80' : 
                    'white'
                }
            />
        )}

        <group>
            {gridData.map((block, i) => {
                // Check highlighting
                let highlightColor: string | undefined = undefined;
                if (validMoves.some(m => m.x === block.x && m.y === block.z)) highlightColor = 'green';
                if (validTargets.some(t => t.x === block.x && t.y === block.z)) highlightColor = 'red';

                return (
                    <group 
                        key={i} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setHoveredTile({x: block.x, z: block.z});
                            onTileClick(block.x, block.z); 
                        }}
                        // Pointer events for hover state (Desktop) and touch feedback
                        onPointerEnter={(e) => {
                            e.stopPropagation();
                            setHoveredTile({x: block.x, z: block.z});
                        }}
                    >
                        <VoxelBlock 
                            position={[block.x, 0, block.z]} 
                            color={block.color} 
                            height={block.height}
                            textureUrl={block.textureUrl}
                            highlightColor={highlightColor}
                        />
                    </group>
                );
            })}
        </group>

        {entities.map(ent => (
            <BillboardUnit
                key={ent.id}
                position={[ent.position.x, 0.3, ent.position.y]}
                color={ent.visual.color}
                spriteUrl={ent.visual.spriteUrl}
                isCurrentTurn={ent.id === currentTurnEntityId}
                hp={ent.stats.hp}
                maxHp={ent.stats.maxHp}
            />
        ))}
        
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[3.5, -1.5, 3.5]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#1e293b" roughness={1} />
        </mesh>
    </>
  );
};

export const BattleScene: React.FC<BattleSceneProps> = (props) => {
    return (
        <div className="w-full h-full bg-slate-950 relative">
           <Canvas shadows camera={{ position: [4, 6, 8], fov: 45 }}>
             <BattleSceneContent {...props} />
          </Canvas>
    
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex-col items-center gap-2 pointer-events-none opacity-70 hover:opacity-100 transition-opacity hidden md:flex">
               <div className="flex gap-4 text-xs text-amber-100 font-serif tracking-wider bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                    <span>🖱️ Double Click/Tap to Confirm</span>
               </div>
          </div>
        </div>
    );
};
