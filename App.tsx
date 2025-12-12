import React from 'react';
import { Experience } from './components/Experience';
import { HandController } from './components/HandController';
import { UI } from './components/UI';

const App = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas */}
      <Experience />
      
      {/* 2D UI Overlay */}
      <UI />
      
      {/* Invisible Logic Layer */}
      <HandController />
    </div>
  );
};

export default App;
