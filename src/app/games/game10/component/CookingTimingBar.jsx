'use client'

import { useState, useEffect, useRef } from "react";
import { Progress } from "./ui/progress";

const CookingTimingBar = ({ onResult }) => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef();
  const direction = useRef(1); // 1 for forward, -1 for backward
  
  // Perfect zone: 40-60%, Overcooked zones: 0-20% and 80-100%
  const perfectZoneStart = 40;
  const perfectZoneEnd = 60;

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (direction.current * 2);
        
        // Bounce back when hitting edges
        if (newProgress >= 100) {
          direction.current = -1;
          return 100;
        } else if (newProgress <= 0) {
          direction.current = 1;
          return 0;
        }
        
        return newProgress;
      });
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const handleClick = () => {
    console.log("handleClick");
    if (!isActive) return;
    
    setIsActive(false);
    
    // Determine result based on progress position
    const result = (progress >= perfectZoneStart && progress <= perfectZoneEnd) 
      ? "perfect" 
      : "burnt";
    
    setTimeout(() => {
      onResult(result);
    }, 200);
  };

  const getZoneColor = (position) => {
    if (position >= perfectZoneStart && position <= perfectZoneEnd) {
      return "bg-green-500";
    }
    return "bg-red-500";
  };

  return (
    <div className="z-10 w-full space-y-2">
      <div className="relative">
        {/* Background zones */}
        <div className="h-6 bg-gray-200 rounded-full relative overflow-hidden">
          {/* Red zones (overcooked) */}
          <div className="absolute left-0 top-0 w-1/5 h-full bg-red-300"></div>
          <div className="absolute right-0 top-0 w-1/5 h-full bg-red-300"></div>
          
          {/* Green zone (perfect) */}
          <div 
            className="absolute top-0 h-full bg-green-300"
            style={{
              left: `${perfectZoneStart}%`,
              width: `${perfectZoneEnd - perfectZoneStart}%`
            }}
          ></div>
          
          {/* Moving indicator */}
          <div
            className="absolute top-0 w-2 h-full bg-white border-2 border-gray-800 transition-all duration-75"
            style={{ left: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <button
        onClick={handleClick}
        disabled={!isActive}
        className=" w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold rounded transition-colors"
      >
        {isActive ? "點擊涮肉!" : "涮肉中..."}
      </button>
      
      <div className="text-xs text-center text-gray-600">
        瞄準綠色區域獲得完美煮熟！
      </div>
    </div>
  );
};

export default CookingTimingBar;
