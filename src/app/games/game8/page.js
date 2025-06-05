"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import React from "react";

const FOOD_TYPES = [
  { name: "meat", img: "/game8images/meat.png" },
  { name: "corn", img: "/game8images/corn.png" },
  { name: "mushroom", img: "/game8images/mushroom.png" },
  { name: "onion", img: "/game8images/onion.png" },
  { name: "bacon", img: "/game8images/bacon.png" },
];

export default function Game() {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [targetCombo, setTargetCombo] = useState([]);
  const [skeweredFoods, setSkeweredFoods] = useState([]);
  const [fallingFoods, setFallingFoods] = useState([]);
  const [nextFood, setNextFood] = useState(null);
  const [skewerPosition, setSkewerPosition] = useState(300);
  const [isMoving, setIsMoving] = useState(false);
  const [debug, setDebug] = useState("");
  const [showMiss, setShowMiss] = useState(false);
  const moveTimeout = useRef(null);
  const dropAnimationRef = useRef(null);
  const missTimeout = useRef(null);

  // 初始化遊戲
  useEffect(() => {
    generateNewTarget();
    const initialFood = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    setNextFood(initialFood);
    
    // 立即生成第一個食材
    generateFood();

    // 每3秒生成一個新食材
    const interval = setInterval(() => {
      generateFood();
    }, 3000);

    return () => {
      clearInterval(interval);
      if (dropAnimationRef.current) cancelAnimationFrame(dropAnimationRef.current);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, []);

  // 生成目標串燒
  const generateNewTarget = () => {
    const newCombo = Array.from({ length: 3 }, () =>
      FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)]
    );
    setTargetCombo(newCombo);
  };

  // 生成新掉落食材
  const generateFood = () => {
    const newFood = {
      ...FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)],
      id: crypto.randomUUID(),
      y: 130,
      x: 575,
    };
    
    setFallingFoods(prev => {
      const newFoods = [...prev, newFood];
      setDebug(`目前有 ${newFoods.length} 個食材在下落中`);
      return newFoods;
    });
    
    setNextFood(FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)]);
  };

  // 掉落動畫
  useEffect(() => {
    const animate = () => {
      setFallingFoods(prevFoods => {
        const updatedFoods = prevFoods
          .map(food => ({ ...food, y: food.y + 1 })) // 更慢的速度
          .filter(food => food.y < 660);
        
        setDebug(`更新位置後還有 ${updatedFoods.length} 個食材`);
        return updatedFoods;
      });
      
      dropAnimationRef.current = requestAnimationFrame(animate);
    };

    dropAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (dropAnimationRef.current) {
        cancelAnimationFrame(dropAnimationRef.current);
      }
    };
  }, []);

  // 插入與吐出邏輯
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" && !isMoving) {
        setIsMoving(true);
        setSkewerPosition(prev => prev + 100);

        // 嘗試接近 450 的食材
        const candidate = fallingFoods.find(f => Math.abs(f.y - 450) <= 20);
        if (candidate && skeweredFoods.length < 3) {
          setSkeweredFoods(prev => {
            const newFoods = [...prev, candidate];
            if (newFoods.length === 3) {
              setTimeout(checkCombo, 100);
            }
            return newFoods;
          });
          setFallingFoods(prev => prev.filter(f => f.id !== candidate.id));
        } else {
          // 顯示 Miss 訊息
          setShowMiss(true);
          // 1秒後隱藏
          if (missTimeout.current) {
            clearTimeout(missTimeout.current);
          }
          missTimeout.current = setTimeout(() => {
            setShowMiss(false);
          }, 1000);
        }

        moveTimeout.current = setTimeout(() => {
          setSkewerPosition(300);
          setIsMoving(false);
        }, 500);
      }
      else if (e.key === "ArrowLeft") {
        if (skeweredFoods.length > 0) {
          setSkeweredFoods(prev => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (missTimeout.current) {
        clearTimeout(missTimeout.current);
      }
    };
  }, [fallingFoods, skeweredFoods, isMoving]);

  // 檢查串燒組合
  const checkCombo = () => {
    const correct = skeweredFoods.every(
      (food, index) => food.name === targetCombo[index].name
    );
    
    if (correct) {
      setScore(prev => prev + 3);
    } else {
      setScore(prev => prev - 1);
    }
    
    setSkeweredFoods([]);
    generateNewTarget();
  };

  // 監控分數變化
  useEffect(() => {
    if (score >= 10) {
      setGameOver(true);
      setGameResult("恭喜完成！串燒達人就是你！");
    } else if (score <= -10) {
      setGameOver(true);
      setGameResult("再接再厲，繼續練習！");
    }
  }, [score]);

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-xl font-bold mb-2 text-black">🍢 串串燒接食物遊戲</h1>
      <div className="mb-4 text-center text-black">
        <p>使用右方向鍵「→」接住食材，左方向鍵「←」吐出上一個食材</p>
        <p>需要按照右上角目標串燒的順序插食材，10分獲勝，-10分失敗！</p>
        <p className="text-blue-500">{debug}</p>
      </div>

      <div className="relative w-[800px] h-[600px] bg-[url('/game8images/background.png')] bg-cover overflow-hidden">
        {/* 分數和目標 */}
        <div className="absolute top-4 left-4 text-white text-2xl">
          分數: {score}
        </div>

        {/* 目標組合 */}
        <div className="absolute top-4 right-4 flex items-center">
          <span className="text-white mr-2">目標串燒:</span>
          {targetCombo.map((food, index) => (
            <React.Fragment key={index}>
              <div
                className="w-[60px] h-[60px] relative mx-1 bg-white/30 p-1 rounded"
              >
                <img
                  src={food.img}
                  alt={food.name}
                  className="w-full h-full object-contain"
                />
              </div>
              {index < targetCombo.length - 1 && (
                <span className="text-white text-2xl mx-1">➡️</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 老闆 */}
        <div className="absolute top-[100px] left-[550px] w-[50px] h-[50px] bg-black" />

        {/* 下一個食材預覽 */}
        <div className="absolute top-[50px] left-[15px] flex items-center">
          <span className="text-white text-xl mr-2">即將掉落：</span>
          {nextFood && (
            <div className="w-[60px] h-[60px] bg-white/50 p-1 rounded">
              <img
                src={nextFood.img}
                alt={nextFood.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* 下落中的食材 */}
        <div className="absolute inset-0 pointer-events-none">
          {fallingFoods.map(food => (
            <div
              key={food.id}
              className="absolute w-[60px] h-[60px]"
              style={{
                left: `${food.x}px`,
                top: `${Math.round(food.y)}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 50,
              }}
            >
              <img
                src={food.img}
                alt={food.name}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* Miss 提示 */}
        {showMiss && (
          <div 
            className="absolute text-red-500 text-2xl font-bold"
            style={{
              left: `${skewerPosition + 100}px`,
              top: "400px",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}
          >
            Miss!
          </div>
        )}

        {/* 竹籤 */}
        <div
          className="absolute h-3 bg-[#CD853F] rounded-full"
          style={{
            left: `${skewerPosition}px`,
            top: "450px",
            width: "200px",
            transition: "left 0.1s",
          }}
        />

        {/* 已插入的食材 */}
        {skeweredFoods.map((food, index) => (
          <div
            key={index}
            className="absolute w-[60px] h-[60px]"
            style={{
              left: `${skewerPosition + index * 70}px`,
              top: "420px",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              padding: "4px",
              borderRadius: "8px",
              transition: "left 0.1s",
            }}
          >
            <img
              src={food.img}
              alt={food.name}
              className="w-full h-full object-contain"
            />
          </div>
        ))}

        {/* 結束畫面 */}
        {gameOver && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
            <div className="text-xl font-semibold mb-4 text-gray-800">
              {gameResult}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                回到主頁
              </button>
              <button
                onClick={() => {
                  setScore(0);
                  setGameOver(false);
                  setGameResult("");
                  setSkeweredFoods([]);
                  setFallingFoods([]);
                  generateNewTarget();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                再玩一次
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
