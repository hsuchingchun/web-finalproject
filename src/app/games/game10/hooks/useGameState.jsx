
import { useState, useCallback } from "react";

export const useGameState = () => {
  const [hearts, setHearts] = useState(1); // Start with 1 heart

  const addHeart = useCallback(() => {
    setHearts(prev => Math.min(prev + 1, 3));
  }, []);

  const removeHeart = useCallback(() => {
    setHearts(prev => Math.max(prev - 1, 0));
  }, []);

  const resetGame = useCallback(() => {
    setHearts(1);
  }, []);

  return {
    hearts,
    addHeart,
    removeHeart,
    resetGame
  };
};
