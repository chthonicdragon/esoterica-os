import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Flame } from 'lucide-react';
import './MobileAltar.css';

interface AltarObject {
  id: number;
  name: string;
}

export default function MobileAltarWrapper() {
  const initialObjects: AltarObject[] = [
    { id: 1, name: 'Candle' },
    { id: 2, name: 'Crystal' },
    { id: 3, name: 'Statue' },
    { id: 4, name: 'Herb' },
  ];

  const [objects, setObjects] = useState(initialObjects);
  const [placedObjects, setPlacedObjects] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ritualActive, setRitualActive] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const placeObject = (obj: AltarObject) => {
    const newObj = {
      ...obj,
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      uid: Date.now(),
    };
    setPlacedObjects([...placedObjects, newObj]);
  };

  const handleStartRitual = () => setShowConfirm(true);
  const confirmRitual = () => {
    setShowConfirm(false);
    setRitualActive(true);
  };
  const cancelRitual = () => setShowConfirm(false);

  return (
    <div id="altar-container">
      <Canvas id="altar-canvas">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {placedObjects.map((obj) => (
          <Html key={obj.uid} position={[obj.x, obj.y, obj.z]}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#ff0',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {obj.name[0]}
            </div>
          </Html>
        ))}
      </Canvas>

      <div id="object-panel">
        {objects.map((obj) => (
          <div
            key={obj.id}
            className="object-item"
            onClick={() => ritualActive && placeObject(obj)}
            style={{ cursor: ritualActive ? 'pointer' : 'not-allowed', opacity: ritualActive ? 1 : 0.5 }}
          >
            {obj.name}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px' }}>
        {!ritualActive && (
          <button
            onClick={handleStartRitual}
            className="start-ritual-button"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(to right, #a855f7, #7c3aed)',
              color: '#fff',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Flame /> Начать ритуал
          </button>
        )}
      </div>

      {showConfirm && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#222',
            padding: '20px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            zIndex: 10,
            color: '#fff',
          }}
        >
          <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: 1.4 }}>
            Вы собираетесь начать ритуал. Отложите телефон, не переключайтесь на другие окна — прогресс будет сброшен. Используйте панель объектов для размещения элементов на алтаре. Сосредоточьтесь и действуйте с намерением.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            <button
              onClick={confirmRitual}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                background: '#4ade80',
                color: '#000',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Начать
            </button>
            <button
              onClick={cancelRitual}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                background: '#f87171',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}