"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, MeshDistortMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

type Wrapped3DSceneProps = {
  slideIndex: number;
};

// Slide 0: Particle Sphere
function ParticleSphere() {
  const ref = useRef<THREE.Points>(null);
  const count = 1000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 2 + Math.random() * 0.5;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Slide 1: Night Mode - Moon and Stars
function NightScene() {
  return (
    <>
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#4a90e2"
          emissive="#2a5f9e"
          emissiveIntensity={0.5}
          roughness={0.8}
        />
      </mesh>
      {/* Crescent shadow */}
      <mesh position={[2.3, 0.2, 0.1]}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          opacity={0.8}
          transparent
        />
      </mesh>
    </>
  );
}

// Slide 2: Two People - Split Scene
function SplitScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Left side - Emerald */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[2, 4, 0.5]} />
        <MeshDistortMaterial
          color="#10b981"
          speed={2}
          distort={0.3}
          radius={1}
        />
      </mesh>
      {/* Right side - Rose */}
      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[2, 4, 0.5]} />
        <MeshDistortMaterial
          color="#f43f5e"
          speed={2}
          distort={0.3}
          radius={1}
        />
      </mesh>
      {/* Dividing line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.05, 5, 0.1]} />
        <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

// Slide 3: Thousand Cuts - Particle Explosion
function ParticleExplosion() {
  const count = 42;
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 2;
      const size = Math.random() * 0.2 + 0.1;
      temp.push({ position: [x, y, z], size });
    }
    return temp;
  }, []);

  return (
    <>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position as [number, number, number]}>
          <sphereGeometry args={[particle.size, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
            opacity={0.8}
            transparent
          />
        </mesh>
      ))}
    </>
  );
}

// Slide 4: Danger Zone - Clock
function ClockScene() {
  const groupRef = useRef<THREE.Group>(null);
  const hours = 12;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Clock face */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[2, 0.05, 16, 100]} />
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>

      {/* Hour markers */}
      {Array.from({ length: hours }).map((_, i) => {
        const angle = (i / hours) * Math.PI * 2;
        const x = Math.cos(angle) * 2;
        const y = Math.sin(angle) * 2;
        return (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
        );
      })}

      {/* Danger zone arc (10pm to 1am) */}
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[2, 0.3, 16, 100, Math.PI / 2]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={0.5}
          opacity={0.6}
          transparent
        />
      </mesh>
    </group>
  );
}

// Slide 5: Question Mark
function QuestionMark() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Question mark curve */}
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[0.5, 0.15, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#a78bfa"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Question mark stem */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#a78bfa"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Dot */}
      <mesh position={[0, -1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#a78bfa"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

export default function Wrapped3DScene({ slideIndex }: Wrapped3DSceneProps) {
  const getScene = () => {
    switch (slideIndex) {
      case 0:
        return <ParticleSphere />;
      case 1:
        return <NightScene />;
      case 2:
        return <SplitScene />;
      case 3:
        return <ParticleExplosion />;
      case 4:
        return <ClockScene />;
      case 5:
        return <QuestionMark />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 opacity-30">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        {getScene()}
      </Canvas>
    </div>
  );
}
