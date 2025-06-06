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
  const [skewerPosition, setSkewerPosition] = useState(250);
  const [isMoving, setIsMoving] = useState(false);
  const [showMiss, setShowMiss] = useState(false);
  const [comboMessage, setComboMessage] = useState("");
  const [showComboMessage, setShowComboMessage] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isBossGenerating, setIsBossGenerating] = useState(false);
  const [showCome, setShowCome] = useState(false);
  const moveTimeout = useRef(null);
  const dropAnimationRef = useRef(null);
  const missTimeout = useRef(null);
  const comboMessageTimeout = useRef(null);
  const [hasMovedOnce, setHasMovedOnce] = useState(false);

  // 初始化遊戲
  useEffect(() => {
    generateNewTarget();
    const initialFood = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    
    // 監聽開始遊戲的按鍵
    const handleStart = (e) => {
      if (!gameStarted && e.key === "ArrowRight") {
        setGameStarted(true);
        // 立即生成第一個食材
        generateFood();
      }
    };

    window.addEventListener("keydown", handleStart);
    return () => {
      window.removeEventListener("keydown", handleStart);
    };
  }, [gameStarted]);

  // 遊戲開始後才啟動食材生成
  useEffect(() => {
    if (!gameStarted) return;

    // 隨機1-5秒生成一個新食材
    const generateNextFood = () => {
      const randomDelay = Math.floor(Math.random() * 4000) + 1000;
      setTimeout(() => {
        generateFood();
        if (!gameOver) {
          generateNextFood();
        }
      }, randomDelay);
    };

    generateNextFood();

    return () => {
      if (dropAnimationRef.current) cancelAnimationFrame(dropAnimationRef.current);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, [gameStarted, gameOver]);

  // 生成目標串燒
  const generateNewTarget = () => {
    const newCombo = Array.from({ length: 3 }, () =>
      FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)]
    );
    setTargetCombo(newCombo);
  };

  // 生成新掉落食材
  const generateFood = () => {
    setIsBossGenerating(true);
    setShowCome(true);
    
    setTimeout(() => {
      setShowCome(false);
    }, 1000);
    
    const newFood = {
      ...FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)],
      id: crypto.randomUUID(),
      y: 300,
      x: 800,
    };
    
    setFallingFoods(prev => {
      const newFoods = [...prev, newFood];
      return newFoods;
    });
    
    setTimeout(() => {
      setIsBossGenerating(false);
    }, 300);
  };

  // 掉落動畫
  useEffect(() => {
    const animate = () => {
      setFallingFoods(prevFoods => {
        const updatedFoods = prevFoods
          .map(food => ({ ...food, y: food.y + 1 })) // 更慢的速度
          .filter(food => food.y < 660);
        
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
        const candidate = fallingFoods.find(f => Math.abs(f.y - 600) <= 20);
        let foodCaught = false;

        if (candidate && skeweredFoods.length < 3) {
          setSkeweredFoods(prev => {
            const newFoods = [...prev, candidate];
            if (newFoods.length === 3) {
              setTimeout(checkCombo, 100);
            }
            return newFoods;
          });
          setFallingFoods(prev => prev.filter(f => f.id !== candidate.id));
          foodCaught = true;
        }

        // 如果沒有接到食材，顯示 Miss
        if (!foodCaught) {
          // 先重置 Miss 狀態，強制重新觸發動畫
          setShowMiss(false);
          setTimeout(() => {
            if (missTimeout.current) {
              clearTimeout(missTimeout.current);
            }
            setShowMiss(true);
            missTimeout.current = setTimeout(() => {
              setShowMiss(false);
              missTimeout.current = null;
            }, 500);
          }, 0);
        }

        moveTimeout.current = setTimeout(() => {
          setSkewerPosition(250);
          setIsMoving(false);
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (missTimeout.current) {
        clearTimeout(missTimeout.current);
        missTimeout.current = null;
      }
    };
  }, [fallingFoods, skeweredFoods, isMoving]);

  // 檢查串燒組合
  const checkCombo = () => {
    const correct = skeweredFoods.every(
      (food, index) => food.name === targetCombo[index].name
    );
    
    // 顯示組合結果訊息
    setShowComboMessage(true);
    setComboMessage(correct ? "good" : "oops");
    
    // 2秒後清除訊息
    if (comboMessageTimeout.current) {
      clearTimeout(comboMessageTimeout.current);
    }
    comboMessageTimeout.current = setTimeout(() => {
      setShowComboMessage(false);
      setComboMessage("");
      
      // 更新分數和清除串燒
      if (correct) {
        setScore(prev => prev + 2);
      } else {
        setScore(prev => prev - 2);
      }
      setSkeweredFoods([]);
      generateNewTarget();
    }, 2000);
  };

  // 監控分數變化
  useEffect(() => {
    if (score >= 6) {
      setGameOver(true);
      setGameResult("恭喜完成！論文進度更近一步！");
    } else if (score <= -6) {
      setGameOver(true);
      setGameResult("再接再厲，繼續練習！");
    }
  }, [score]);

  // 清理所有timeouts
  useEffect(() => {
    return () => {
      if (missTimeout.current) {
        clearTimeout(missTimeout.current);
      }
      if (comboMessageTimeout.current) {
        clearTimeout(comboMessageTimeout.current);
      }
    };
  }, []);

  // 監控玩家位置，控制message顯示
  useEffect(() => {
    if (skewerPosition !== 250 && gameStarted && !hasMovedOnce) {
      setHasMovedOnce(true);
    }
  }, [skewerPosition, gameStarted]);

  // 修改 showMessage 的條件
  const shouldShowMessage = !hasMovedOnce && skewerPosition === 250;

  return (
    <div className="flex flex-col items-center bg-black">
      <div 
        className="relative w-screen h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/game8images/background.png')",
          minHeight: "100vh"
        }}
      >
        {/* 開始遊戲遮罩 */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
            <img
              src="/game8images/start.png"
              alt="Press Right Arrow to Start"
              className="w-[70%] h-[70%] object-contain"
            />
          </div>
        )}

        {/* 分數和目標 */}
        <div className="absolute top-20 right-100 flex flex-col items-center gap-1 bg-white/70 p-3 rounded-lg border-2 border-[#D7CD77] shadow-md">
          <img
            src="/game8images/score.png"
            alt="score"
            className="h-6 object-contain"
          />
          <img
            src={`/game8images/number/${score}.png`}
            alt={score.toString()}
            className="h-10 object-contain"
          />
        </div>

        {/* 目標組合 */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="mb-2 w-[100px]">
            <img
              src="/game8images/target.png"
              alt="目標串燒"
              className="w-full object-contain"
            />
          </div>
          <div className="flex items-center">
            {targetCombo.map((food, index) => (
              <React.Fragment key={index}>
                <div
                  className="w-[60px] h-[60px] relative mx-1 bg-white/70 p-1 rounded border-2 border-[#D7CD77] shadow-md"
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
        </div>

        {/* 老闆 */}
        <div className="absolute top-[228px] left-[770px] w-[150px] h-[150px]">
          {showCome && (
            <img
              src="/game8images/come.png"
              alt="come"
              className="absolute -top-10 -left-16 w-[100px] h-[100px] object-contain z-10"
            />
          )}
          <img
            src={isBossGenerating ? "/game8images/boss1.png" : "/game8images/boss2.png"}
            alt="boss"
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))"
            }}
          />
        </div>

       

        {/* 下落中的食材 */}
        <div className="absolute inset-0 pointer-events-none">
          {fallingFoods.map(food => (
            <div
              key={food.id}
              className="absolute w-[80px] h-[80px]"
              style={{
                left: `${food.x}px`,
                top: `${Math.round(food.y)}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 50,
                padding: "4px"
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
            className="absolute"
            style={{
              left: `${skewerPosition + 200}px`,
              top: "500px",
              zIndex: 100,
              animation: "missAnimation 0.5s ease-out forwards"
            }}
          >
            <img
              src="/game8images/miss.png"
              alt="Miss"
              className="w-[100px] object-contain"
            />
          </div>
        )}

        {/* 組合結果提示 */}
        {showComboMessage && (
          <div 
            className="absolute"
            style={{
              left: `${skewerPosition + 300}px`,
              top: "500px",
              zIndex: 100,
              animation: "comboMessage 0.5s ease-out ease-in forwards"
            }}
          >
            <img
              src={`/game8images/${comboMessage}.png`}
              alt={comboMessage}
              className="w-[200px] object-contain"
            />
          </div>
        )}

        {/* 竹籤 */}
        <div
          className="absolute"
          style={{
            left: `${skewerPosition}px`,
            top: "435px",
            width: "500px",
            transition: "left 0.1s",
          }}
        >
          {shouldShowMessage && (
            <img
              src="/game8images/message.png"
              alt="message"
              className="absolute left-2/3 -translate-x-1/2 top-10 w-[350px] object-contain drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))"
              }}
            />
          )}
          <img
            src="/game8images/player.png"
            alt="player"
            className="w-full h-full object-contain"
          />
        </div>

        {/* 已插入的食材 */}
        {skeweredFoods.map((food, index) => (
          <div
            key={index}
            className="absolute w-[80px] h-[80px]"
            style={{
              left: `${skewerPosition + index * 80 + 250}px`,
              top: "565px",
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

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes missAnimation {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes comboMessage {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
