import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Environment, Clouds, Cloud } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { MagicTree } from './MagicTree';
import { useStore } from '../store';
import * as THREE from 'three';

const CameraController = () => {
  const { mode, focusedImageIndex } = useStore();
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state, delta) => {
    // Smooth camera transition
    const damp = 2 * delta;
    
    if (mode === 'tree') {
      vec.set(0, 0, 18); // Default view
    } else if (mode === 'dispersed') {
      vec.set(0, 2, 25); // Wider view
    } else if (mode === 'zoomed' && focusedImageIndex !== null) {
      vec.set(0, 0, 5); 
    }

    camera.position.lerp(vec, damp);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// --- FRACTAL SNOWFLAKE GENERATOR ---
const generateSnowflakeTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new THREE.Texture();

  const width = 512;
  const height = 512;
  const cx = width / 2;
  const cy = height / 2;
  
  const config = {
      branches: 6,
      depth: 4, 
      radius: 200, 
  };

  function drawBranch(len: number, thickness: number, depth: number) {
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = `rgba(225, 245, 255, ${0.9 - (depth * 0.1)})`; 
      ctx.lineCap = 'round';
      ctx.stroke();

      if (depth > 0) {
          const positions = [0.35, 0.65, 0.90]; 
          
          for (let i = 0; i < positions.length; i++) {
              const pos = positions[i];
              
              ctx.save();
              ctx.translate(0, -len * pos);
              
              const subLen = len * 0.4 * (1 - i * 0.15);
              const subThickness = thickness * 0.6;

              ctx.save();
              ctx.rotate(-Math.PI / 3); 
              drawBranch(subLen, subThickness, depth - 1);
              ctx.restore();

              ctx.save();
              ctx.rotate(Math.PI / 3); 
              drawBranch(subLen, subThickness, depth - 1);
              ctx.restore();

              ctx.restore();
          }
      }
  }

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < config.branches; i++) {
      ctx.save();
      ctx.rotate(i * (Math.PI * 2 / config.branches));
      drawBranch(config.radius, 12, config.depth); 
      ctx.restore();
  }

  ctx.beginPath();
  const hexSize = 25;
  for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const x = Math.cos(angle) * hexSize;
      const y = Math.sin(angle) * hexSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'cyan';
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// --- SNOW COMPONENT ---
const Snow = ({ count = 1000 }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const snowflakeTexture = useMemo(() => generateSnowflakeTexture(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 60,
        y: Math.random() * 40 - 10,
        z: (Math.random() - 0.5) * 60,
        factor: Math.random() * Math.PI,
        speed: 0.02 + Math.random() * 0.08,
        rotSpeed: (Math.random() - 0.5) * 0.5
      });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      particle.y -= particle.speed; 
      if (particle.y < -20) {
        particle.y = 25;
        particle.x = (Math.random() - 0.5) * 60; 
        particle.z = (Math.random() - 0.5) * 60; 
      }
      dummy.position.set(
        particle.x + Math.sin(time * 0.5 + particle.factor) * 1.5, 
        particle.y, 
        particle.z + Math.cos(time * 0.3 + particle.factor) * 1.5
      );
      dummy.rotation.x = time * particle.rotSpeed + particle.factor;
      dummy.rotation.y = time * (particle.rotSpeed * 0.5);
      dummy.rotation.z = time * 0.1;
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.5, 0.5]} /> 
      <meshBasicMaterial 
        map={snowflakeTexture}
        color="#ffffff" 
        transparent 
        opacity={0.9} 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

// --- VOLUMETRIC BACKGROUND COMPONENT ---
const VolumetricBackground = () => {
  return (
    <group>
      {/* 
        Clouds using MeshLambertMaterial will react to the scene lights (Gold and Red) 
        creating a unified atmosphere 
      */}
      <Clouds material={THREE.MeshLambertMaterial} limit={400} range={200}>
        {/* Deep background layer - Dense and dark */}
        <Cloud 
            concentrate="outside" 
            seed={1} 
            segments={40} 
            bounds={20} 
            volume={20} 
            color="#051505" 
            opacity={0.8}
            scale={10}
            position={[0, 0, -10]}
        />
        
        {/* Middle layer - Catching highlights */}
        <Cloud 
            seed={2} 
            segments={20} 
            bounds={20} 
            volume={10} 
            color="#0a2a0a" 
            opacity={0.5} 
            scale={6}
            position={[10, 5, -5]}
            speed={0.2}
        />
        
        <Cloud 
            seed={3} 
            segments={20} 
            bounds={20} 
            volume={10} 
            color="#0a2a0a" 
            opacity={0.5} 
            scale={6}
            position={[-10, -5, -5]}
            speed={0.2}
        />
      </Clouds>
    </group>
  );
};

// --- REACTIVE DISPERSAL EFFECTS ---
// Adds intense white dots when the tree is dispersed
const DispersalEffects = () => {
  const { mode } = useStore();

  return (
    <group>
      {/* 1. Subtle Ambient Dust (Always visible) */}
      <Sparkles count={150} scale={20} size={2} speed={0.4} opacity={0.3} color="#ffffff" />

      {/* 2. EXPLOSION PARTICLES (Only when dispersed) */}
      {mode === 'dispersed' && (
        <group>
           {/* High Density Stardust - Chaotic and fast */}
           <Sparkles 
             count={2000} 
             scale={50}     // Spread very wide
             size={3} 
             speed={2.5}    // Fast movement
             opacity={0.9} 
             color="#ffffff"
             noise={1.0}    // High noise for chaotic swirling
           />
           
           {/* Large Bokeh Orbs - Dreamy and slow */}
           <Sparkles 
             count={100}
             scale={40}
             size={25}
             speed={0.5}
             opacity={0.4}
             color="#e6ffee" // Slight tint to distinguish from snow
           />
        </group>
      )}
    </group>
  );
};

export const Experience = () => {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 18], fov: 45 }} gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        
        {/* Darker background to let the volumetric clouds pop */}
        <color attach="background" args={['#000500']} />
        
        {/* Subtle fog for blending */}
        <fog attach="fog" args={['#000500', 5, 35]} />

        {/* Environment for metallic reflections on the tree */}
        <Environment preset="city" />

        {/* --- NEW 3D CLOUD BACKGROUND --- */}
        <VolumetricBackground />

        {/* --- FALLING FRACTAL SNOW --- */}
        <Snow />

        {/* --- REACTIVE PARTICLES (Dispersal Effect) --- */}
        <DispersalEffects />

        {/* Cinematic Lighting - Crucial for lighting up the clouds */}
        <ambientLight intensity={0.2} color="#051505" />
        
        {/* Main Golden Spotlight - Lights up the top of clouds */}
        <spotLight 
          position={[10, 20, 10]} 
          angle={0.5} 
          penumbra={1} 
          intensity={5} 
          color="#ffd700" 
          castShadow 
          distance={100}
        />
        
        {/* Fill Light Red - Lights up the bottom/side of clouds */}
        <pointLight position={[-15, -10, -5]} intensity={3} color="#ff0000" distance={50} decay={2} />
        
        {/* Inner Tree Glow (The Soul of the Tree) */}
        <pointLight position={[0, 0, 0]} intensity={4.0} color="#ffaa00" distance={20} decay={2} />

        {/* Stars piercing through the clouds */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {/* Concentrated Gold Sparkles on the Tree (Independent of dispersal) */}
        <Sparkles count={500} scale={10} size={5} speed={0.4} opacity={1} color="#ffeb3b" />

        <MagicTree />
        <CameraController />
        
        <EffectComposer enableNormalPass={false}>
          {/* Intense Bloom for the Glow Effect */}
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={2.0} />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};