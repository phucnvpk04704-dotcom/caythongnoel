import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { generateParticles } from '../utils';

// Reusable geometry and materials for performance
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);

// Enhanced Gold Material: Higher emissive for glow, low roughness for sparkles
const goldMaterial = new THREE.MeshStandardMaterial({ 
  color: '#ffd700', 
  metalness: 1.0, 
  roughness: 0.05,
  emissive: '#ffaa00',
  emissiveIntensity: 0.8
});

// Enhanced Red Material: Deep ruby glow
const redMaterial = new THREE.MeshStandardMaterial({ 
  color: '#d40000', 
  metalness: 0.8, 
  roughness: 0.1,
  emissive: '#ff0000',
  emissiveIntensity: 1.0
});

// New Emerald Green Material
const greenMaterial = new THREE.MeshStandardMaterial({
  color: '#004d00', // Deep forest green
  metalness: 0.9,
  roughness: 0.1,
  emissive: '#002600',
  emissiveIntensity: 0.6
});

// Frame Material for the orbiting photos
const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#ffcc00',
  metalness: 1,
  roughness: 0.2,
  emissive: '#ffcc00',
  emissiveIntensity: 0.2
});

// --- NEW COMPONENT: THE NORTH STAR ---
const TopStar = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Rotation animation
    groupRef.current.rotation.y = time * 0.5;
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;

    // Bobbing animation (floating up and down)
    groupRef.current.position.y = 6.5 + Math.sin(time) * 0.15;

    // Pulsing Scale
    const scale = 1 + Math.sin(time * 3) * 0.1;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef} position={[0, 6.5, 0]}>
      {/* Light Source from the Star */}
      <pointLight intensity={10} distance={10} color="#fff" decay={2} />
      
      {/* Core White-Hot Diamond */}
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="white" 
          emissive="white" 
          emissiveIntensity={4} 
          toneMapped={false} 
        />
      </mesh>

      {/* Outer Golden Spikes (Rotated 45 degrees) */}
      <mesh rotation={[0, Math.PI / 4, 0]} scale={1.3}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={1} 
          roughness={0} 
          emissive="#ff8800" 
          emissiveIntensity={2} 
          transparent 
          opacity={0.9} 
        />
      </mesh>

      {/* Halo Effect Plane */}
      <mesh scale={3}>
        <planeGeometry />
        <meshBasicMaterial 
          color="#ffd700" 
          transparent 
          opacity={0.1} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// --- NEW COMPONENT: ORBITING GALLERY ---
// Creates a SPIRAL of small photos rotating around the tree
const OrbitingGallery = ({ textures }: { textures: THREE.Texture[] | THREE.Texture }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { mode } = useStore();
  
  // Normalized textures array
  const textureArray = Array.isArray(textures) ? textures : [textures];
  
  // Configuration
  const count = 16; // More frames for a nice spiral
  const spiralHeight = 11; // Total height span (-5.5 to 5.5)
  const loops = 2.5; // How many times it wraps around

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Continuous rotation of the whole spiral
    const speed = mode === 'dispersed' ? 0.8 : 0.2;
    groupRef.current.rotation.y -= delta * speed; // Negative for upward spiral feel
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => {
        const ratio = i / count; // 0 to 1
        
        // 1. Calculate Spiral Position
        
        // Angle: Distribute around 360 degrees * loops
        const angle = ratio * Math.PI * 2 * loops;
        
        // Height: From bottom to top
        const y = -5.5 + (ratio * spiralHeight);
        
        // Radius: Tapered (Cone shape) - Wide at bottom, narrow at top
        // Bottom radius ~7, Top radius ~2
        const radius = 7 * (1 - ratio) + 2; 

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Cycle through textures
        const tex = textureArray[i % textureArray.length];

        return (
          <FloatingFrame 
            key={i} 
            position={[x, y, z]} 
            // Rotation: Face outward, slightly tilted up
            rotation={[0, -angle - Math.PI / 2, 0]} 
            texture={tex} 
            index={i}
            mode={mode}
          />
        );
      })}
    </group>
  )
};

const FloatingFrame = ({ position, rotation, texture, index, mode }: any) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Gentle floating
    const yOffset = Math.sin(time * 2 + index) * 0.2;
    
    // Expansion when dispersed
    const expansion = mode === 'dispersed' ? 1.8 : 1.0;
    
    meshRef.current.position.set(
      position[0] * expansion, 
      position[1] + yOffset, 
      position[2] * expansion
    );
  });

  return (
    <group ref={meshRef} rotation={rotation}>
        {/* The Photo - Significantly smaller (0.8 width) */}
        <mesh>
          <planeGeometry args={[0.8, 1.0]} /> {/* Small Portrait */}
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
        
        {/* The Frame */}
        <mesh position={[0, 0, -0.02]}>
           <boxGeometry args={[0.9, 1.1, 0.05]} />
           <primitive object={frameMaterial} />
        </mesh>

        {/* Decorative Top Hanger (Scaled down) */}
        <mesh position={[0, 0.6, 0]}>
           <torusGeometry args={[0.1, 0.02, 8, 16]} />
           <primitive object={goldMaterial} />
        </mesh>
    </group>
  );
}

export const MagicTree = () => {
  const { mode, images, handPosition } = useStore();
  
  // We use InstancedMesh for high performance
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  const greenBlocksRef = useRef<THREE.InstancedMesh>(null);
  
  // Photos need individual meshes usually for textures, but we can try a Group of meshes for simplicity in texture mapping
  const photoGroupRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  const { tree, random } = useMemo(() => generateParticles(images.length), [images.length]);
  
  // Pre-load textures
  // If no images, use a placeholder. 
  // We ensure we load at least one texture to prevent errors.
  const imageUrls = images.length > 0 ? images : ['https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&q=80&w=300&h=400'];
  const textures = useLoader(THREE.TextureLoader, imageUrls); 

  useFrame((state, delta) => {
    // Smooth damping factor
    const damp = 4 * delta;
    const time = state.clock.elapsedTime;

    // Animate Materials (Pulsing Glow)
    // We modify the global material properties slightly for a breathing effect
    goldMaterial.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.4;
    redMaterial.emissiveIntensity = 0.8 + Math.cos(time * 1.5) * 0.4;
    greenMaterial.emissiveIntensity = 0.6 + Math.sin(time * 2.5) * 0.3;

    // 1. ROTATION BASED ON HAND
    if (groupRef.current) {
        // Map hand X (-1 to 1) to rotation Y
        // We invert X for natural "dragging" feel
        const targetRotY = -handPosition.x * Math.PI;
        const targetRotX = handPosition.y * 0.5;

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, damp);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, damp);
    }
  });

  // Simulation Ref for positions
  const currentPositions = useRef(random.map(p => ({ ...p, position: [...p.position] as [number, number, number] })));

  useFrame((state, delta) => {
    const damp = 3 * delta;
    
    let sphereCount = 0;
    let cubeCount = 0;
    let greenBlockCount = 0;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < tree.length; i++) {
      const target = (mode === 'tree') ? tree[i] : random[i];
      
      // Lerp position
      const curr = currentPositions.current[i];
      
      curr.position[0] = THREE.MathUtils.lerp(curr.position[0], target.position[0], damp);
      curr.position[1] = THREE.MathUtils.lerp(curr.position[1], target.position[1], damp);
      curr.position[2] = THREE.MathUtils.lerp(curr.position[2], target.position[2], damp);

      // Lerp Rotation (spin when dispersing)
      if (mode === 'dispersed') {
         curr.rotation[1] += delta * 0.5;
      }

      dummy.position.set(curr.position[0], curr.position[1], curr.position[2]);
      dummy.rotation.set(curr.rotation[0], curr.rotation[1], curr.rotation[2]);
      dummy.scale.setScalar(target.scale);

      // Add floating bobbing effect
      if (mode === 'dispersed') {
        dummy.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
      }

      dummy.updateMatrix();

      if (target.type === 'orb' && spheresRef.current) {
        spheresRef.current.setMatrixAt(sphereCount++, dummy.matrix);
      } else if (target.type === 'cube' && cubesRef.current) {
        cubesRef.current.setMatrixAt(cubeCount++, dummy.matrix);
      } else if (target.type === 'green_block' && greenBlocksRef.current) {
        greenBlocksRef.current.setMatrixAt(greenBlockCount++, dummy.matrix);
      } else if (target.type === 'photo' && photoGroupRef.current) {
        // Handle React Children for photos (inner tree photos)
        const child = photoGroupRef.current.children[target.imageIndex || 0];
        if (child) {
            child.position.copy(dummy.position);
            child.rotation.copy(dummy.rotation);
            if (mode === 'tree') {
                child.lookAt(0, child.position.y, 0); 
                child.rotateY(Math.PI); 
            } else {
                child.rotation.set(curr.rotation[0], curr.rotation[1], curr.rotation[2]);
            }
            child.scale.setScalar(target.scale);
        }
      }
    }

    if (spheresRef.current) spheresRef.current.instanceMatrix.needsUpdate = true;
    if (cubesRef.current) cubesRef.current.instanceMatrix.needsUpdate = true;
    if (greenBlocksRef.current) greenBlocksRef.current.instanceMatrix.needsUpdate = true;
  });

  const orbCount = tree.filter(t => t.type === 'orb').length;
  const cubeCount = tree.filter(t => t.type === 'cube').length;
  const greenCount = tree.filter(t => t.type === 'green_block').length;

  return (
    <group>
        {/* Independent Orbiting Gallery (Does not rotate with hand drag, rotates on its own) */}
        <OrbitingGallery textures={textures} />

        {/* The Interactive Tree Group */}
        <group ref={groupRef}>
        <TopStar />

        <instancedMesh ref={spheresRef} args={[sphereGeo, goldMaterial, orbCount]} />
        <instancedMesh ref={cubesRef} args={[cubeGeo, redMaterial, cubeCount]} />
        <instancedMesh ref={greenBlocksRef} args={[cubeGeo, greenMaterial, greenCount]} />
        
        {/* Inner Tree Photos */}
        <group ref={photoGroupRef}>
            {images.map((img, idx) => {
                const tex = Array.isArray(textures) ? textures[idx] : textures;
                // If single texture returned but multiple images, handle gracefully
                const actualTex = tex instanceof THREE.Texture ? tex : (tex as any); 
                
                return (
                    <mesh key={idx}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial map={actualTex} side={THREE.DoubleSide} />
                        <mesh position={[0,0,-0.02]}>
                            <boxGeometry args={[1.1, 1.1, 0.05]} />
                            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#aa6600" emissiveIntensity={0.5} />
                        </mesh>
                    </mesh>
                )
            })}
        </group>
        </group>
    </group>
  );
};