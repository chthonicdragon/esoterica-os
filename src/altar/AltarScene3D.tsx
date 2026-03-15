import { useRef, Suspense, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import type { AltarLayout } from './types'
import { CATALOG, ALTAR_THEMES, ALTAR_BASES } from './catalog'
import { AltarObject3D } from './AltarObject3D'
import { resolveModelUrl } from '../lib/modelUrlResolver'
import { resolveModelUrl } from '../lib/modelUrlResolver'

type AltarVisualPreset = 'soft' | 'cinematic'
const PRELOADED_MODEL_URLS = new Set<string>()

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

function AltarBaseModel({ url, tint, targetSpan, targetTopY }: { url: string, tint: string, targetSpan: number, targetTopY: number }) {
  const gltf = useGLTF(url)
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    const sourceBox = new THREE.Box3().setFromObject(cloned)
    const sourceSize = new THREE.Vector3()
    sourceBox.getSize(sourceSize)

    const span = Math.max(sourceSize.x, sourceSize.z, 1e-6)
    const uniformScale = targetSpan / span
    cloned.scale.setScalar(uniformScale)

    const fittedBox = new THREE.Box3().setFromObject(cloned)
    const fittedCenter = new THREE.Vector3()
    fittedBox.getCenter(fittedCenter)

    // Keep altar centered and anchor its highest point to the placement plane.
    cloned.position.x -= fittedCenter.x
    cloned.position.z -= fittedCenter.z
    cloned.position.y -= fittedBox.max.y - targetTopY

    return cloned
  }, [gltf.scene, targetSpan, targetTopY])

  useMemo(() => {
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.castShadow = true
      node.receiveShadow = true
      if (node.material instanceof THREE.MeshStandardMaterial) {
        node.material = node.material.clone()
        node.material.color.multiply(new THREE.Color(tint))
      }
    })
  }, [model, tint])

  return <primitive object={model} />
}

function AltarBaseMesh({
  modelUrl,
  tint,
  targetSpan,
  targetTopY,
}: {
  modelUrl: string
  tint: string
  targetSpan: number
  targetTopY: number
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    resolveModelUrl(modelUrl).then(url => {
      if (isMounted) setResolvedUrl(url)
    })
    return () => { isMounted = false }
  }, [modelUrl])

  if (!resolvedUrl) return null

  return <Suspense fallback={null}><AltarBaseModel url={resolvedUrl} tint={tint} targetSpan={targetSpan} targetTopY={targetTopY} /></Suspense>
}

// The altar table surface
function AltarTable({
  themeKey,
  baseId,
  baseModelUrl,
  workSurfaceY,
}: {
  themeKey: string
  baseId: AltarLayout['baseId']
  baseModelUrl?: string
  workSurfaceY: number
}) {
  const theme = ALTAR_THEMES[themeKey as keyof typeof ALTAR_THEMES]
  const altarBase = ALTAR_BASES.find(base => base.id === baseId)
  if (!theme) return null

  return (
    <group>
      {altarBase ? (
        <AltarBaseMesh
          modelUrl={baseModelUrl || altarBase.modelUrl}
          tint={altarBase.tint}
          targetSpan={altarBase.targetSpan}
          targetTopY={workSurfaceY}
        />
      ) : (
        <>
          {/* Fallback primitive table if model metadata is missing. */}
          <mesh position={[0, 0, 0]} receiveShadow castShadow>
            <boxGeometry args={[2.0, 0.08, 1.2]} />
            <meshStandardMaterial
              color={theme.altarColor}
              roughness={theme.altarRoughness}
              metalness={theme.altarMetalness}
            />
          </mesh>
          {[[-0.88, -0.3, -0.52], [0.88, -0.3, -0.52], [-0.88, -0.3, 0.52], [0.88, -0.3, 0.52]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} receiveShadow castShadow>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial color={theme.altarColor} roughness={0.9} metalness={0} />
            </mesh>
          ))}
          {/* Decorative edge trim for fallback table only. */}
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
        </>
      )}
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

// Soft contact shadow so the table does not look like it floats in space.
function AltarGroundContact({
  themeKey,
  ritualActive,
  candleGlowStrength,
}: {
  themeKey: string
  ritualActive: boolean
  candleGlowStrength: number
}) {
  const theme = ALTAR_THEMES[themeKey as keyof typeof ALTAR_THEMES]
  const baseColor = themeKey === 'wood' ? '#120a03' : (theme?.floorColor || '#080914')
  const candleGlowRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (!candleGlowRef.current) return
    const mat = candleGlowRef.current.material as THREE.MeshStandardMaterial
    const t = Date.now() * 0.003
    const pulse = 0.12 + Math.sin(t * 0.8) * 0.06
    const activeBoost = ritualActive ? 1.35 : 1
    mat.opacity = Math.max(0.06, (0.08 + pulse) * candleGlowStrength * activeBoost)
  })

  return (
    <group position={[0, -0.598, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <circleGeometry args={[1.05, 48]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={0.36}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -0.002, 0]}>
        <circleGeometry args={[1.45, 48]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={0.16}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={candleGlowRef} position={[0, -0.003, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshStandardMaterial
          color="#ffb56a"
          emissive="#ff7a1a"
          emissiveIntensity={0.3}
          transparent
          opacity={0.08}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Drop target plane (invisible, catches pointer events for placement)
function DropPlane({ onDrop, workSurfaceY }: { onDrop: (pos: [number, number, number]) => void; workSurfaceY: number }) {
  return (
    <mesh
      position={[0, workSurfaceY, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onDrop([e.point.x, workSurfaceY, e.point.z])
      }}
    >
      <planeGeometry args={[2.0, 1.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
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

// Component to dynamically adjust camera based on aspect ratio
function ResponsiveCamera() {
  const { size, camera } = useThree()
  const isPortrait = size.width < size.height

  useMemo(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, isPortrait ? 1.7 : 1.15, isPortrait ? 2.95 : 1.7)
      camera.fov = isPortrait ? 50 : 42
      camera.updateProjectionMatrix()
    }
  }, [isPortrait, camera])

  return null
}

function SceneControls({ ritualActive, workSurfaceY }: { ritualActive: boolean; workSurfaceY: number }) {
  const { size } = useThree()
  const isPortrait = size.width < size.height
  const controlsRef = useRef<any>(null)

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, workSurfaceY, 0]}
      enablePan={isPortrait && !ritualActive}
      enableZoom={true}
      minDistance={isPortrait ? 1.6 : 1.1}
      maxDistance={isPortrait ? 4.4 : 2.6}
      minPolarAngle={0.55}
      maxPolarAngle={1.15}
      minAzimuthAngle={-0.45}
      maxAzimuthAngle={0.45}
      dampingFactor={0.05}
      enableDamping
      onChange={() => {
        if (!isPortrait || !controlsRef.current) return
        const t = controlsRef.current.target
        t.x = THREE.MathUtils.clamp(t.x, -0.4, 0.4)
        t.y = workSurfaceY
        t.z = 0
      }}
    />
  )
}

function SceneLoadingBridge({
  onProgress,
}: {
  onProgress?: (progress: number, active: boolean) => void
}) {
  const { progress, active } = useProgress()
  useEffect(() => {
    onProgress?.(Math.max(0, Math.min(100, progress)), active)
  }, [progress, active, onProgress])
  return null
}

interface AltarScene3DProps {
  layout: AltarLayout
  visualPreset: AltarVisualPreset
  workSurfaceY?: number
  renderQuality?: 'high' | 'safe'
  selectedId: string | null
  ritualActive: boolean
  ritualProgress: number
  pendingDrop: string | null // catalog item id to place on click
  onSelect: (id: string | null) => void
  onDropPlaced: (pos: [number, number, number]) => void
  onContextLost?: () => void
  onLoadingProgress?: (progress: number, active: boolean) => void
}

export function AltarScene3D({
  layout,
  visualPreset,
  workSurfaceY = 0.12,
  renderQuality = 'high',
  selectedId,
  ritualActive,
  ritualProgress,
  pendingDrop,
  onSelect,
  onDropPlaced,
  onContextLost,
  onLoadingProgress,
}: AltarScene3DProps) {
  const isSafeQuality = renderQuality === 'safe'
  const theme = ALTAR_THEMES[layout.theme]
  const hasModelBase = ALTAR_BASES.some(base => base.id === layout.baseId)
  const catalogMap = useMemo(() => Object.fromEntries(CATALOG.map(c => [c.id, c])), [])
  const [resolvedModelUrls, setResolvedModelUrls] = useState<Record<string, string>>({})
  const baseModelUrl = ALTAR_BASES.find(base => base.id === layout.baseId)?.modelUrl
  const candleCount = layout.objects.reduce((acc, placed) => {
    const cat = catalogMap[placed.catalogId]
    return acc + (cat?.effect === 'flicker' ? 1 : 0)
  }, 0)
  const candleGlowStrength = Math.min(1, 0.2 + candleCount * 0.12)

  useEffect(() => {
    const modelUrls = new Set<string>()
    if (baseModelUrl) modelUrls.add(baseModelUrl)
    layout.objects.forEach((placed) => {
      const catalogItem = catalogMap[placed.catalogId]
      if (catalogItem?.modelUrl) modelUrls.add(catalogItem.modelUrl)
    })
    const pending = Array.from(modelUrls)
    if (pending.length === 0) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        pending.map(async (url) => [url, await resolveModelUrl(url)] as const)
      )
      if (cancelled) return
      setResolvedModelUrls((prev) => {
        const next = { ...prev }
        entries.forEach(([source, resolved]) => {
          next[source] = resolved
        })
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [baseModelUrl, layout.objects, catalogMap])

  useEffect(() => {
    const modelUrls = new Set<string>()
    if (baseModelUrl) modelUrls.add(baseModelUrl)
    layout.objects.forEach((placed) => {
      const catalogItem = catalogMap[placed.catalogId]
      if (catalogItem?.modelUrl) modelUrls.add(catalogItem.modelUrl)
    })

    modelUrls.forEach((sourceUrl) => {
      const targetUrl = resolvedModelUrls[sourceUrl] || sourceUrl
      if (PRELOADED_MODEL_URLS.has(targetUrl)) return
      PRELOADED_MODEL_URLS.add(targetUrl)
      useGLTF.preload(targetUrl)
    })
  }, [baseModelUrl, layout.objects, catalogMap, resolvedModelUrls])

  const lighting = useMemo(() => {
    if (visualPreset === 'soft') {
      return {
        ambientIntensity: Math.max(0.3, theme.ambientIntensity * 0.82),
        keyColor: '#95afff',
        keyIntensity: ritualActive ? 0.52 : 0.46,
        fillColor: '#6f6ad8',
        fillIntensity: ritualActive ? 0.24 : 0.18,
        rimColor: '#86b9ff',
        rimIntensity: ritualActive ? 0.28 : 0.2,
        candleBase: 0.12,
        candleBoost: 0.26,
        fogNear: 5.8,
        fogFar: 13.0,
      }
    }

    return {
      ambientIntensity: Math.max(0.24, theme.ambientIntensity * 0.66),
      keyColor: '#8ea3ff',
      keyIntensity: ritualActive ? 0.64 : 0.56,
      fillColor: '#6c5bd6',
      fillIntensity: ritualActive ? 0.3 : 0.22,
      rimColor: '#8a63ff',
      rimIntensity: ritualActive ? 0.44 : 0.3,
      candleBase: 0.14,
      candleBoost: 0.34,
      fogNear: 5.2,
      fogFar: 11.8,
    }
  }, [visualPreset, theme.ambientIntensity, ritualActive])

  return (
    <Canvas
      shadows={isSafeQuality ? false : 'soft'}
      dpr={isSafeQuality ? [1, 1] : [1, 1.2]}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      camera={{ near: 0.1, far: 50 }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        // Prevent default browser teardown and let WebGL recover when possible.
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          console.warn('WebGL context lost; trying to recover renderer context.')
          onContextLost?.()
        })
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <SceneLoadingBridge onProgress={onLoadingProgress} />
      {/* Lighting */}
      <ambientLight color={theme.ambientColor} intensity={lighting.ambientIntensity} />
      <directionalLight
        position={[-2.3, 3.9, 2.1]}
        color={lighting.keyColor}
        intensity={lighting.keyIntensity}
        castShadow
        shadow-mapSize={isSafeQuality ? [256, 256] : [512, 512]}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-camera-left={-1.8}
        shadow-camera-right={1.8}
        shadow-camera-top={1.8}
        shadow-camera-bottom={-1.8}
        shadow-bias={-0.0003}
      />
      <pointLight position={[0.15, 1.3, 1.15]} color={lighting.fillColor} intensity={lighting.fillIntensity} distance={5} decay={2} />
      <pointLight position={[1.6, 1.2, -1.7]} color={lighting.rimColor} intensity={lighting.rimIntensity} distance={4.6} decay={2} />
      <pointLight position={[0.1, 0.46, 0.08]} color="#ffb366" intensity={lighting.candleBase + candleGlowStrength * lighting.candleBoost} distance={1.5} decay={2} />

      {/* Fog */}
      {/* @ts-ignore */}
      <fog attach="fog" args={[theme.fogColor, lighting.fogNear, lighting.fogFar]} />

      {/* Altar */}
      <Suspense fallback={null}>
        <AltarTable
          themeKey={layout.theme}
          baseId={layout.baseId}
          baseModelUrl={baseModelUrl ? resolvedModelUrls[baseModelUrl] || baseModelUrl : undefined}
          workSurfaceY={workSurfaceY}
        />
      </Suspense>
      {!hasModelBase && <AltarCloth themeKey={layout.theme} />}
      <AltarGroundContact
        themeKey={layout.theme}
        ritualActive={ritualActive}
        candleGlowStrength={candleGlowStrength}
      />

      {/* Ambient mist */}
      {!isSafeQuality && <AmbientMist active={ritualActive} />}

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
            modelUrl={cat.modelUrl ? (resolvedModelUrls[cat.modelUrl] || cat.modelUrl) : undefined}
            selected={selectedId === placed.id}
            ritualActive={ritualActive}
            onSelect={onSelect}
          />
        )
      })}

      {/* Drop target */}
      {pendingDrop && <DropPlane onDrop={onDropPlaced} workSurfaceY={workSurfaceY} />}

      {/* Camera controls */}
      <SceneControls ritualActive={ritualActive} workSurfaceY={workSurfaceY} />
      <ResponsiveCamera />
    </Canvas>
  )
}
