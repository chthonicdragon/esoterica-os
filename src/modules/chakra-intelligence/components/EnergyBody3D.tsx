import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { CHAKRA_INFO, ChakraName } from '../types'

const CHAKRA_POSITIONS: Record<ChakraName, [number, number, number]> = {
  root: [0, -3, 0],
  sacral: [0, -2, 0],
  solar_plexus: [0, -1, 0],
  heart: [0, 0, 0],
  throat: [0, 1, 0],
  third_eye: [0, 2, 0],
  crown: [0, 3, 0],
}

const CHAKRA_ORDER: ChakraName[] = ['root', 'sacral', 'solar_plexus', 'heart', 'throat', 'third_eye', 'crown']

type BodyVariant = 'male' | 'female'

function BodyModel({ variant, intensity }: { variant: BodyVariant; intensity: number }) {
  const url = variant === 'female' ? '/chakras/female_muscle_human_body.glb' : '/chakras/man_muscle_human_body.glb'
  const gltf = useGLTF(url) as unknown as { scene: THREE.Group }

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#cfe2ff'),
      transparent: true,
      opacity: 0.16 + intensity * 0.18,
      roughness: 0.92,
      metalness: 0.02,
      emissive: new THREE.Color('#6aa3ff'),
      emissiveIntensity: 0.08 + intensity * 0.22,
      depthWrite: false,
    })
  }, [intensity])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  const { object, scale, yOffset } = useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if ((mesh as any).isMesh) {
        mesh.castShadow = false
        mesh.receiveShadow = false
        mesh.material = material
      }
    })

    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const targetHeight = 7.0
    const s = size.y > 0 ? targetHeight / size.y : 1
    return { object: clone, scale: s, yOffset: -center.y }
  }, [gltf.scene, material])

  return (
    <group position={[0, yOffset * scale, -0.22]} scale={[scale, scale, scale]}>
      <primitive object={object} />
    </group>
  )
}

function ChakraSphere({
  name,
  level,
  color,
  index,
  scanStartAt,
  onSelect,
}: {
  name: ChakraName
  level: number
  color: string
  index: number
  scanStartAt: number
  onSelect: (name: ChakraName) => void
}) {
  const coreRef = useRef<THREE.Mesh>(null)
  const auraRef = useRef<THREE.Mesh>(null)
  const [burstUntil, setBurstUntil] = useState(0)
  const position = CHAKRA_POSITIONS[name]
  const energy = Math.max(0, Math.min(1, level / 100))

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const now = performance.now()
    const scanElapsed = scanStartAt > 0 ? (now - scanStartAt) / 1000 : -1
    const scanFlash = scanElapsed >= index * 0.16 && scanElapsed <= index * 0.16 + 0.4
    const burst = now < burstUntil || scanFlash
    const pulse = Math.sin(time * 2.0) * 0.04
    const wavePulse = Math.sin(time * (1.2 + energy * 1.8)) * 0.03
    const baseScale = 1.0 + energy * 0.2
    const burstMul = burst ? 1.12 : 1
    const coreScale = (baseScale + pulse + wavePulse) * burstMul
    const auraScale = coreScale * (1.35 + energy * 0.12) + Math.sin(time * (1.0 + energy * 1.6)) * 0.03

    if (coreRef.current) {
      coreRef.current.scale.setScalar(coreScale)
      coreRef.current.rotation.y += 0.006
    }
    if (auraRef.current) {
      auraRef.current.scale.setScalar(auraScale)
    }
  })

  return (
    <group position={new THREE.Vector3(...position)} onPointerDown={(e) => {
      e.stopPropagation()
      setBurstUntil(performance.now() + 1000)
      onSelect(name)
    }}>
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  )
}

function EnergyChannel({ energy, scanStartAt }: { energy: number; scanStartAt: number }) {
  const stops = useMemo(() => CHAKRA_ORDER.map(n => new THREE.Color(CHAKRA_INFO[n].color)), [])
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.8 + energy * 1.6 },
        uIntensity: { value: 0.4 + energy * 0.8 },
        uScanBoost: { value: 0 },
        uStops: { value: stops.map(c => new THREE.Vector3(c.r, c.g, c.b)) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uIntensity;
        uniform float uScanBoost;
        uniform vec3 uStops[7];
        varying vec2 vUv;
        
        vec3 chakraGradient(float t){
          float x = clamp(t * 6.0, 0.0, 6.0);
          if (x < 1.0) return mix(uStops[0], uStops[1], x - 0.0);
          if (x < 2.0) return mix(uStops[1], uStops[2], x - 1.0);
          if (x < 3.0) return mix(uStops[2], uStops[3], x - 2.0);
          if (x < 4.0) return mix(uStops[3], uStops[4], x - 3.0);
          if (x < 5.0) return mix(uStops[4], uStops[5], x - 4.0);
          return mix(uStops[5], uStops[6], x - 5.0);
        }
        void main() {
          float flow = fract(vUv.y * 4.0 - uTime * uSpeed);
          float streak = smoothstep(0.0, 0.2, flow) * (1.0 - smoothstep(0.2, 0.45, flow));
          float pulse = 0.5 + 0.5 * sin(uTime * 2.4 + vUv.y * 12.0);
          float alpha = 0.12 + streak * (0.38 + uIntensity * 0.32) + pulse * 0.08;
          alpha *= (1.0 + uScanBoost * 0.65);
          vec3 col = chakraGradient(clamp(vUv.y, 0.0, 1.0));
          gl_FragColor = vec4(col * (0.6 + uIntensity * 0.5 + uScanBoost * 0.4), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [energy, stops])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  useFrame((state) => {
    const now = performance.now()
    const scanElapsed = scanStartAt > 0 ? (now - scanStartAt) / 1000 : -1
    const scanActive = scanElapsed >= 0 && scanElapsed <= 1.6
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    material.uniforms.uSpeed.value = 0.8 + energy * 1.8
    material.uniforms.uIntensity.value = 0.35 + energy
    material.uniforms.uScanBoost.value = scanActive ? 1 : 0
  })

  return (
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[0.028, 0.028, 6.6, 24, 1, true]} />
      <mesh material={material} />
    </mesh>
  )
}

function EnergyParticles({ energy, mobile }: { energy: number; mobile: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array>(new Float32Array(0))
  const speedsRef = useRef<Float32Array>(new Float32Array(0))
  const count = useMemo(() => {
    const base = mobile ? 48 : 92
    return Math.floor(base + energy * (mobile ? 42 : 78))
  }, [mobile, energy])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 0.45 + Math.random() * 1.8
      const theta = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = -3.2 + Math.random() * 6.7
      positions[i * 3 + 2] = Math.sin(theta) * r
      speeds[i] = 0.12 + Math.random() * (0.22 + energy * 0.35)
    }
    positionsRef.current = positions
    speedsRef.current = speeds
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [count, energy])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const positions = positionsRef.current
    const speeds = speedsRef.current
    for (let i = 0; i < count; i++) {
      const id = i * 3 + 1
      positions[id] += speeds[i] * delta
      if (positions[id] > 3.55) positions[id] = -3.3
    }
    const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
    const material = pointsRef.current.material as THREE.PointsMaterial
    material.opacity = 0.16 + (0.5 + 0.5 * Math.sin(state.clock.getElapsedTime() * 1.4)) * 0.18
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#d9e7ff"
        size={mobile ? 0.018 : 0.022}
        transparent
        opacity={0.22}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function CameraBreath() {
  const { camera } = useThree()
  useFrame((state) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const t = state.clock.getElapsedTime()
      camera.fov = 49 + Math.sin(t * 0.22) * 1.8
      camera.updateProjectionMatrix()
    }
  })
  return null
}

interface EnergyBodyProps {
  chakras: Record<ChakraName, { level: number; color: string }>
  lang?: 'en' | 'ru'
  scanTrigger?: number
  bodyVariant?: BodyVariant
  onChakraClick?: (chakra: ChakraName) => void
}

export function EnergyBody3D({ chakras, lang = 'en', scanTrigger = 0, bodyVariant = 'male', onChakraClick }: EnergyBodyProps) {
  const [selected, setSelected] = useState<ChakraName>('heart')
  const [scanStartAt, setScanStartAt] = useState(0)
  const mobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
  const avgEnergy = useMemo(() => {
    const values = CHAKRA_ORDER.map((chakra) => chakras[chakra]?.level ?? 0)
    return values.reduce((acc, value) => acc + value, 0) / (values.length * 100)
  }, [chakras])

  useEffect(() => {
    if (scanTrigger > 0) setScanStartAt(performance.now())
  }, [scanTrigger])

  const selectedLabel = lang === 'ru'
    ? CHAKRA_INFO[selected].nameRu
    : CHAKRA_INFO[selected].name

  return (
    <div className="w-full h-[380px] sm:h-[420px] md:h-[500px] rounded-xl overflow-hidden bg-black/40 border border-white/10 relative">
      <Canvas camera={{ position: [0, 0, 7.6], fov: 49 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.28} />
        <hemisphereLight intensity={0.22} color="#cfe2ff" groundColor="#140818" />
        <directionalLight position={[3.5, 5.2, 4.6]} intensity={0.35} color="#ffffff" />
        <Stars radius={72} depth={42} count={mobile ? 850 : 1400} factor={4} saturation={0} fade speed={0.4} />
        <EnergyParticles energy={avgEnergy} mobile={mobile} />
        <React.Suspense fallback={null}>
          <group>
            <BodyModel variant={bodyVariant} intensity={avgEnergy} />
            {CHAKRA_ORDER.map((name, index) => (
              (() => {
                const level = typeof chakras[name]?.level === 'number' ? chakras[name].level : 50
                const chakraColor = CHAKRA_INFO[name].color
                return (
              <ChakraSphere
                key={name}
                name={name}
                level={level}
                color={chakraColor}
                index={index}
                scanStartAt={scanStartAt}
                onSelect={(chakra) => {
                  setSelected(chakra)
                  onChakraClick?.(chakra)
                }}
              />
                )
              })()
            ))}
            <EnergyChannel energy={avgEnergy} scanStartAt={scanStartAt} />
          </group>
        </React.Suspense>
        <CameraBreath />
        <OrbitControls enableZoom autoRotate autoRotateSpeed={0.28 + avgEnergy * 0.5} minDistance={6.2} maxDistance={8.3} />
      </Canvas>

      <div className="absolute top-3 left-3 text-[11px] text-white/65 px-2 py-1 rounded border border-white/10 bg-black/35 backdrop-blur">
        {lang === 'ru' ? `Активная чакра: ${selectedLabel}` : `Active chakra: ${selectedLabel}`}
      </div>
      <div className="absolute bottom-4 left-4 text-xs text-white/50 leading-relaxed">
        {lang === 'ru' ? 'Кликните по чакре для энергетического всплеска' : 'Tap a chakra for an energy burst'}
      </div>
    </div>
  )
}
