import * as THREE from 'three';
import { ParticleData } from './types';

const TREE_HEIGHT = 12;
const TREE_RADIUS = 5;
const PARTICLE_COUNT = 400;

// Helper to get random position in a sphere (for dispersed state)
export const getRandomPosition = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
};

// Helper to get position on a cone spiral (for tree state)
export const getTreePosition = (index: number, total: number): [number, number, number] => {
  const ratio = index / total; // 0 to 1
  const h = ratio * TREE_HEIGHT - (TREE_HEIGHT / 2); // Height from bottom to top
  
  // Inverse radius: wider at bottom (low h), narrower at top (high h)
  // Adjusted so ratio 0 is bottom
  const r = ((1 - ratio) * TREE_RADIUS) + 0.5; 
  
  const angle = index * 137.5 * (Math.PI / 180); // Golden angle
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return [x, h, z];
};

export const generateParticles = (imageCount: number): { tree: ParticleData[], random: ParticleData[] } => {
  const treeData: ParticleData[] = [];
  const randomData: ParticleData[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Determine type
    let type: 'orb' | 'cube' | 'green_block' | 'photo' = 'orb';
    let imgIdx = -1;

    // First N particles are photos if available
    if (i < imageCount) {
      type = 'photo';
      imgIdx = i;
    } else {
      const rand = Math.random();
      if (rand > 0.75) {
        type = 'cube'; // Red Cubes
      } else if (rand > 0.55) {
        type = 'green_block'; // Green Blocks (Emeralds)
      } else {
        type = 'orb'; // Gold Orbs
      }
    }

    // Tree Position
    const tPos = getTreePosition(i, PARTICLE_COUNT);
    treeData.push({
      position: tPos,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: type === 'photo' ? 1.5 : Math.random() * 0.3 + 0.1,
      type,
      imageIndex: imgIdx
    });

    // Random Dispersed Position
    const rPos = getRandomPosition(15);
    randomData.push({
      position: rPos,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: type === 'photo' ? 1.5 : Math.random() * 0.3 + 0.1,
      type,
      imageIndex: imgIdx
    });
  }

  return { tree: treeData, random: randomData };
};