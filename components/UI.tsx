import React, { useRef } from 'react';
import { useStore } from '../store';

export const UI = () => {
  const { gesture, addImage, images, mode } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const url = URL.createObjectURL(file as Blob);
        addImage(url);
      });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-100 font-bold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Nordic Noel
          </h1>
          <p className="text-green-100/70 text-sm mt-1 uppercase tracking-widest">Gesture Controlled Experience</p>
        </div>
        
        {/* Upload Control */}
        <div className="pointer-events-auto">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="bg-red-900/80 hover:bg-red-800 text-yellow-100 border border-yellow-500/30 px-6 py-2 rounded-sm backdrop-blur-md transition-all duration-300 font-serif uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(138,11,11,0.5)]"
           >
             + Add Memories
           </button>
           <input 
             ref={fileInputRef} 
             type="file" 
             multiple 
             accept="image/*" 
             className="hidden" 
             onChange={handleFileUpload}
           />
           <div className="text-right mt-2 text-xs text-yellow-500/80">
             {images.length} photos loaded
           </div>
        </div>
      </div>

      {/* Center Status - Dynamic */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
         {mode === 'zoomed' && (
            <div className="text-2xl font-serif text-white/90 animate-pulse tracking-[0.2em]">
                CHERISHED MEMORY
            </div>
         )}
      </div>

      {/* Footer / Instructions */}
      <div className="flex justify-between items-end">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 max-w-md">
          <h3 className="text-yellow-500 font-serif mb-2 border-b border-white/10 pb-1">Gesture Commands</h3>
          <ul className="text-sm space-y-2 text-gray-300">
            <li className={`flex items-center gap-2 ${gesture === 'Fist' ? 'text-green-400 font-bold' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_currentColor]"></span>
              <span><strong>Fist:</strong> Converge Tree</span>
            </li>
            <li className={`flex items-center gap-2 ${gesture === 'Open' ? 'text-green-400 font-bold' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_currentColor]"></span>
              <span><strong>Open Hand:</strong> Disperse Magic</span>
            </li>
            <li className={`flex items-center gap-2 ${gesture === 'Pinch' ? 'text-green-400 font-bold' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_currentColor]"></span>
              <span><strong>Pinch:</strong> Zoom Memory</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              <span><strong>Move Hand:</strong> Rotate View</span>
            </li>
          </ul>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">CURRENT STATE</div>
          <div className="text-xl font-bold text-yellow-100 uppercase tracking-widest">{mode}</div>
          <div className="text-xs text-green-400 mt-1">Detected: {gesture}</div>
        </div>
      </div>
    </div>
  );
};