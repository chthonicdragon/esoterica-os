import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CatalogItem, PlacedObject } from './types'

interface AltarObject3DProps {
  placed: PlacedObject
  catalog: CatalogItem
  selected: boolean
  ritualActive: boolean
  onSelect: (id: string) => void
  onPositionChange: (id: string, pos: [number, number, number]) => void
}

class ModelErrorBoundary extends React.Component<{
  fallback: React.ReactNode
  children: React.ReactNode
}, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('Model failed to load, rendering fallback geometry:', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function ModelMesh({ modelUrl, color }: { modelUrl: string; color: string }) {
  const gltf = useGLTF(modelUrl)
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true)

    // Normalize arbitrary GLB authoring scale/origin so all models place consistently.
    const sourceBox = new THREE.Box3().setFromObject(cloned)
    const sourceSize = new THREE.Vector3()
    sourceBox.getSize(sourceSize)
    const maxSide = Math.max(sourceSize.x, sourceSize.y, sourceSize.z, 1e-6)
    const fitScale = 1 / maxSide
    cloned.scale.setScalar(fitScale)

    // Recompute after scaling; translations in object space must use scaled bounds.
    const normalizedBox = new THREE.Box3().setFromObject(cloned)
    const normalizedCenter = new THREE.Vector3()
    normalizedBox.getCenter(normalizedCenter)

    // Center on X/Z and place model base on Y=0 so it stands on altar surface.
    cloned.position.x -= normalizedCenter.x
    cloned.position.y -= normalizedBox.min.y
    cloned.position.z -= normalizedCenter.z

    return cloned
  }, [gltf.scene])

  useEffect(() => {
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.castShadow = true
      node.receiveShadow = true
      if (node.material instanceof THREE.MeshStandardMaterial) {
        node.material = node.material.clone()
        node.material.color.multiply(new THREE.Color(color))
      }
    })
  }, [model, color])

  return <primitive object={model} />
}

// Flame particle for candles
function Flame({ position, active }: { position: [number, number, number]; active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null!)
  const [offset] = useState(() => Math.random() * Math.PI * 2)

  useFrame(() => {
    const t = Date.now() * 0.003 + offset
    if (lightRef.current) {
      lightRef.current.intensity = active ? 0.5 + Math.sin(t * 11) * 0.2 : 0
    }
  })

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color="#ff8800"
        intensity={active ? 0.5 : 0}
        distance={1.2}
        decay={2}
      />
    </group>
  )
}

// Smoke particle system
function SmokeParticles({ position, active }: { position: [number, number, number]; active: boolean }) {
  const count = 8
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const [offsets] = useState(() => Array.from({ length: count }, (_, i) => ({
    phase: (i / count) * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 0.05,
  })))

  useFrame(() => {
    if (!active) return
    offsets.forEach((o, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const t = (Date.now() * 0.0005 * o.speed + o.phase) % 1
      mesh.position.y = position[1] + t * 0.4
      mesh.position.x = position[0] + Math.sin(t * 8 + o.phase) * 0.02 + o.drift * t
      mesh.scale.setScalar(0.5 + t * 1.5)
      ;(mesh.material as THREE.MeshStandardMaterial).opacity = active ? (1 - t) * 0.3 : 0
    })
  })

  return (
    <>
      {offsets.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el }} position={[position[0], position[1], position[2]]}>
          <sphereGeometry args={[0.012, 4, 4]} />
          <meshStandardMaterial
            color="#aaaaaa"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

// Crystal glow effect
function CrystalGlow({ position, color, active }: { position: [number, number, number]; color: string; active: boolean }) {
  const ref = useRef<THREE.PointLight>(null!)
  useFrame(() => {
    if (!ref.current) return
    const t = Date.now() * 0.002
    ref.current.intensity = active
      ? 0.6 + Math.sin(t) * 0.2
      : 0.2 + Math.sin(t * 0.5) * 0.1
  })
  return <pointLight ref={ref} position={position} color={color} intensity={0.3} distance={0.8} decay={2} />
}

export function AltarObject3D({
  placed,
  catalog,
  selected,
  ritualActive,
  onSelect,
  onPositionChange,
}: AltarObject3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const isModel = Boolean(catalog.modelUrl)

  const geometry = useMemo(() => {
    switch (catalog.geometry) {
      case 'cylinder':
        return new THREE.CylinderGeometry(
          catalog.scale[0], catalog.scale[0] * 1.1,
          catalog.scale[1], 12
        )
      case 'box':
        return new THREE.BoxGeometry(...catalog.scale)
      case 'sphere':
        return new THREE.SphereGeometry(catalog.scale[0], 16, 16)
      case 'cone':
        return new THREE.ConeGeometry(catalog.scale[0], catalog.scale[1], 8)
      case 'torus':
        return new THREE.TorusGeometry(catalog.scale[0], catalog.scale[2], 8, 24)
      default:
        return new THREE.BoxGeometry(...catalog.scale)
    }
  }, [catalog])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: catalog.color,
    emissive: catalog.emissive,
    emissiveIntensity: catalog.emissiveIntensity * (ritualActive ? 1.8 : 1),
    roughness: 0.5,
    metalness: catalog.category === 'coins' ? 0.9 : 0.1,
  }), [catalog, ritualActive])

  // Update emissive on ritual toggle
  useEffect(() => {
    material.emissiveIntensity = catalog.emissiveIntensity * (ritualActive ? 1.8 : 1)
  }, [ritualActive, material, catalog.emissiveIntensity])

  // Sparkle / gentle float animation
  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (catalog.effect === 'sparkle' || catalog.effect === 'glow') {
      const t = Date.now() * 0.001
      groupRef.current.position.y = placed.position[1] + Math.sin(t * 1.5 + placed.position[0]) * 0.005
    }
    if (hovered || selected) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  const [px, py, pz] = placed.position
  const flamePos: [number, number, number] = isModel
    ? [0, catalog.scale[1] + 0.03, 0]
    : [0, catalog.scale[1] / 2 + 0.01, 0]
  const smokeOffset: [number, number, number] = [px, py + catalog.scale[1] / 2, pz]

  return (
    <group
      ref={groupRef}
      position={placed.position}
      rotation={[0, placed.rotationY, 0]}
      scale={placed.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(placed.id) }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {isModel && catalog.modelUrl ? (
        <ModelErrorBoundary
          fallback={
            <mesh
              geometry={geometry}
              material={material}
              castShadow
              receiveShadow
            />
          }
        >
          <group scale={catalog.scale}>
            <ModelMesh modelUrl={catalog.modelUrl} color={catalog.color} />
          </group>
        </ModelErrorBoundary>
      ) : (
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
        />
      )}

      {/* Selection ring */}
      {(selected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -catalog.scale[1] / 2 + 0.01, 0]}>
          <ringGeometry args={[catalog.scale[0] * 1.2, catalog.scale[0] * 1.5, 32]} />
          <meshBasicMaterial
            color={selected ? '#a855f7' : '#00ffd1'}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Candle flame */}
      {catalog.effect === 'flicker' && (
        <Flame position={flamePos} active={ritualActive || true} />
      )}

      {/* Crystal glow light */}
      {catalog.effect === 'glow' && (
        <CrystalGlow
          position={[0, 0, 0]}
          color={catalog.emissive}
          active={ritualActive}
        />
      )}

      {/* Smoke particles */}
      {catalog.effect === 'smoke' && (
        <SmokeParticles position={[0, catalog.scale[1] / 2, 0]} active={true} />
      )}
    </group>
  )
}
