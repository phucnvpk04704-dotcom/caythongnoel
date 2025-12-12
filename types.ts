export interface ParticleData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  type: 'orb' | 'cube' | 'green_block' | 'photo';
  imageIndex?: number;
}