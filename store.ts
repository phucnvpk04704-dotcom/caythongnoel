import { create } from 'zustand';

export type AppMode = 'tree' | 'dispersed' | 'zoomed';

interface AppState {
  mode: AppMode;
  handPosition: { x: number; y: number };
  gesture: string;
  images: string[];
  focusedImageIndex: number | null;
  
  // Actions
  setMode: (mode: AppMode) => void;
  setHandPosition: (x: number, y: number) => void;
  setGesture: (gesture: string) => void;
  addImage: (url: string) => void;
  setFocusedImage: (index: number | null) => void;
}

export const useStore = create<AppState>((set) => ({
  mode: 'tree',
  handPosition: { x: 0, y: 0 },
  gesture: 'None',
  images: [], // User uploaded images
  focusedImageIndex: null,

  setMode: (mode) => set({ mode }),
  setHandPosition: (x, y) => set({ handPosition: { x, y } }),
  setGesture: (gesture) => set({ gesture }),
  addImage: (url) => set((state) => ({ images: [...state.images, url] })),
  setFocusedImage: (index) => set({ focusedImageIndex: index }),
}));