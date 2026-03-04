import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { AltarLayout } from './types'
import { CATALOG, ALTAR_THEMES } from './catalog'
import { AltarObject3D } from './AltarObject3D'

// Animated ambient smoke / mist
function AmbientMist({ active }: { active: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = Date.now() * 0.0003 + i * 1.5
      m.position.x = Math.sin(t) * 0.6
      m.position.z = Math.cos(t * 0.7) * 0.4
      ;(m.material as THREE.MeshStandardMaterial).opacity = active ? 0.04 + Math.sin(t * 2) * 0.02 : 0.02
    })
  })
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={el => { refs.current[i] = el }} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.9 + i * 0.3, 0.9 + i * 0.3, 0.05, 24]} />
          <meshStandardMaterial color="#8888aa" transparent opacity={0.02} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// The altar table surface
function AltarTable({ themeKey }: { themeKey: string }) {
  const theme = ALTAR_THEMES[themeKey as keyof typeof ALTAR_THEMES]
  if (!theme) return null

  return (
    <group>
      {/* Table top */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.0, 0.08, 1.2]} />
        <meshStandardMaterial
          color={theme.altarColor}
          roughness={theme.altarRoughness}
          metalness={theme.altarMetalness}
        />
      </mesh>
      {/* Table legs */}
      {[[-0.88, -0.3, -0.52], [0.88, -0.3, -0.52], [-0.88, -0.3, 0.52], [0.88, -0.3, 0.52]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} receiveShadow castShadow>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color={theme.altarColor} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {/* Decorative edge trim */}
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[2.04, 0.01, 1.24]} />
        <meshStandardMaterial
          color={themeKey === 'mystical' ? '#9333ea' : themeKey === 'obsidian' ? '#6622cc' : theme.altarColor}
          emissive={themeKey === 'mystical' ? '#6600cc' : '#000000'}
          emissiveIntensity={themeKey === 'mystical' ? 0.5 : 0}
          roughness={0.3}
          metalness={themeKey === 'mystical' || themeKey === 'obsidian' ? 0.8 : 0.1}
        />
      </mesh>
    </group>
  )
}

// Sacred geometry cloth/rune on altar
function AltarCloth({ themeKey }: { themeKey: string }) {
  const glowRef = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (!glowRef.current) return
    const t = Date.now() * 0.001
    ;(glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1 + Math.sin(t) * 0.05
  })

  return (
    <mesh ref={glowRef} position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.8, 1.0, 1, 1]} />
      <meshStandardMaterial
        color={themeKey === 'wood' ? '#3d1f00' : '#110022'}
        emissive={themeKey === 'mystical' ? '#4400aa' : '#220044'}
        emissiveIntensity={0.15}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  )
}

// Drop target plane (invisible, catches pointer events for placement)
function DropPlane({ onDrop }: { onDrop: (pos: [number, number, number]) => void }) {
  return (
    <mesh
      position={[0, 0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onDrop([e.point.x, 0.05, e.point.z])
      }}
    >
      <planeGeometry args={[2.0, 1.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// Floor / environment
function Floor({ themeKey }: { themeKey: string }) {
  const theme = ALTAR_THEMES[themeKey as keyof typeof ALTAR_THEMES]
  return (
    <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color={theme?.floorColor || '#0a0514'} roughness={0.95} metalness={0} />
    </mesh>
  )
}

// Circular ritual progress ring floating above altar
function RitualRing({ progress, active }: { progress: number; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const particleRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    if (!ringRef.current || !active) return
    ringRef.current.rotation.y += 0.005
    ;(ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.002) * 0.2

    // Orbit particles
    particleRefs.current.forEach((p, i) => {
      if (!p) return
      const angle = (Date.now() * 0.001) + (i / particleRefs.current.length) * Math.PI * 2
      const radius = 1.2
      p.position.x = Math.cos(angle) * radius
      p.position.z = Math.sin(angle) * radius
      p.position.y = 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.1
    })
  })

  if (!active) return null

  return (
    <group>
      {/* Outer ring */}
      <mesh ref={ringRef} position={[0, 0.5, 0]} rotation={[-Math.PI / 6, 0, 0]}>
        <torusGeometry args={[1.1, 0.015, 8, 64, Math.PI * 2 * progress]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c22c4"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Orbit particles */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={el => { particleRefs.current[i] = el }}>
          <sphereGeometry args={[0.015, 4, 4]} />
          <meshBasicMaterial color="#00ffd1" />
        </mesh>
      ))}
    </group>
  )
}

interface AltarScene3DProps {
  layout: AltarLayout
  selectedId: string | null
  ritualActive: boolean
  ritualProgress: number
  pendingDrop: string | null // catalog item id to place on click
  onSelect: (id: string | null) => void
  onObjectMoved: (id: string, pos: [number, number, number]) => void
  onDropPlaced: (pos: [number, number, number]) => void
}

export function AltarScene3D({
  layout,
  selectedId,
  ritualActive,
  ritualProgress,
  pendingDrop,
  onSelect,
  onObjectMoved,
  onDropPlaced,
}: AltarScene3DProps) {
  const theme = ALTAR_THEMES[layout.theme]

  const catalogMap = Object.fromEntries(CATALOG.map(c => [c.id, c]))

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.4, 2.2], fov: 45, near: 0.1, far: 50 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onSelect(null)}
    >
      {/* Lighting */}
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />
      <directionalLight
        position={[2, 4, 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
      <pointLight position={[-1, 2, -1]} color="#6622cc" intensity={0.3} />
      <pointLight position={[1, 1.5, 1]} color="#00ffd1" intensity={ritualActive ? 0.3 : 0.05} />

      {/* Fog */}
      {/* @ts-ignore */}
      <fog attach="fog" args={[theme.fogColor, 6, 14]} />

      {/* Altar */}
      <Suspense fallback={null}>
        <AltarTable themeKey={layout.theme} />
        <AltarCloth themeKey={layout.theme} />
        <Floor themeKey={layout.theme} />

        {/* Ambient mist */}
        <AmbientMist active={ritualActive} />

        {/* Ritual progress ring */}
        <RitualRing progress={ritualProgress} active={ritualActive} />

        {/* Placed objects */}
        {layout.objects.map(placed => {
          const cat = catalogMap[placed.catalogId]
          if (!cat) return null
          return (
            <AltarObject3D
              key={placed.id}
              placed={placed}
              catalog={cat}
              selected={selectedId === placed.id}
              ritualActive={ritualActive}
              onSelect={onSelect}
              onPositionChange={onObjectMoved}
            />
          )
        })}

        {/* Drop target */}
        {pendingDrop && <DropPlane onDrop={onDropPlaced} />}
      </Suspense>

      {/* Camera controls — disable pan in ritual mode */}
      <OrbitControls
        enablePan={!ritualActive}
        enableZoom={true}
        minDistance={1.0}
        maxDistance={5}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        dampingFactor={0.05}
        enableDamping
      />
    </Canvas>
  )
}
