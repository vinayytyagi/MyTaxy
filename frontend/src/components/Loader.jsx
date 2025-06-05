import React from 'react';
import myTaxyLogo from '../assets/MyTaxy.png';

const Loader = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[200px]">
      {/* Fixed Logo */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <img 
          src={myTaxyLogo} 
          alt="MyTaxy" 
          className="w-32 h-32"
        />
      </div>
       {/* Loading text */}
       <div className="text-gray-600 font-medium animate-pulse">
        Loading...
      </div>
    </div>
  );
};

export default Loader; 