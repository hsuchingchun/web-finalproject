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
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [smokeEffects, setSmokeEffects] = useState([]);
  const [status, setStatus] = useState(0);
  
  // 音效控制
  const bgmRef = useRef(null);
  const [bgmIsPlaying, setBgmIsPlaying] = useState(true);
  const soundClickRef = useRef(null);
  const soundGoodRef = useRef(null);
  const soundOppsRef = useRef(null);
  const soundComeRef = useRef(null);

  // 音效播放
  const bgmPlay = () => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.8;
      bgmRef.current.play();
    }
  };

  // 預載圖片列表
  const preloadImages = [
    "/game8images/background.png",
    "/game8images/start.png",
    "/game8images/startPress.png",
    "/game8images/backPress.png",
    "/game8images/againPress.png",
    "/game8images/homePress.png",
    "/game8images/boss1.png",
    "/game8images/boss2.png",
    "/game8images/player.png",
    "/game8images/come.png",
    "/game8images/message.png",
    "/game8images/miss.png",
    "/game8images/good.png",
    "/game8images/oops.png",
    "/game8images/win.png",
    "/game8images/loss.png",
    "/game8images/score.png",
    "/game8images/target.png",
    "/game8images/smoke.png",
    "/game8images/soundon.png",
    "/game8images/soundmuted.png",
    "/game8images/back.png",
    ...FOOD_TYPES.map(food => food.img),
    ...Array.from({length: 13}, (_, i) => `/game8images/number/${i-6}.png`), // 載入-6到6的數字圖片
  ];

  // 預載所有圖片
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = preloadImages.length;

    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadedCount++;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${src}`);
          loadedCount++;
          resolve(); // 即使載入失敗也繼續
        };
      });
    };

    Promise.all(preloadImages.map(preloadImage))
      .then(() => {
        setImagesLoaded(true);
        // 給一個短暫的延遲確保UI更新
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      })
      .catch(error => {
        console.error('Image preloading error:', error);
        // 即使有錯誤也繼續遊戲
        setImagesLoaded(true);
        setIsLoading(false);
      });
  }, []);

  // 音樂開關
  const toggleBgm = () => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    if (bgmIsPlaying) {
      bgm.pause();
      // 關閉所有音效
      if (soundClickRef.current) soundClickRef.current.muted = true;
      if (soundGoodRef.current) soundGoodRef.current.muted = true;
      if (soundOppsRef.current) soundOppsRef.current.muted = true;
      if (soundComeRef.current) soundComeRef.current.muted = true;
    } else {
      bgm.play().catch((err) => {
        console.warn('播放失敗：', err);
      });
      // 開啟所有音效
      if (soundClickRef.current) soundClickRef.current.muted = false;
      if (soundGoodRef.current) soundGoodRef.current.muted = false;
      if (soundOppsRef.current) soundOppsRef.current.muted = false;
      if (soundComeRef.current) soundComeRef.current.muted = false;
    }

    setBgmIsPlaying(!bgmIsPlaying);
  };

  // 點擊音效
  const clickPlay = () => {
    if (soundClickRef.current) {
      soundClickRef.current.currentTime = 0;
      soundClickRef.current.play().catch((err) => {
        console.warn('播放音效失敗', err);
      });
    }
  };

  // 成功音效
  const goodPlay = () => {
    if (soundGoodRef.current) {
      soundGoodRef.current.currentTime = 0;
      soundGoodRef.current.play().catch((err) => {
        console.warn('播放音效失敗', err);
      });
    }
  };

  // 失敗音效
  const oppsPlay = () => {
    if (soundOppsRef.current) {
      soundOppsRef.current.currentTime = 0;
      soundOppsRef.current.play().catch((err) => {
        console.warn('播放音效失敗', err);
      });
    }
  };

  // 當遊戲開始時設置所有音效的初始狀態
  useEffect(() => {
    if (gameStarted) {
      bgmPlay();
      // 設置所有音效的初始狀態
      if (soundClickRef.current) soundClickRef.current.muted = !bgmIsPlaying;
      if (soundGoodRef.current) soundGoodRef.current.muted = !bgmIsPlaying;
      if (soundOppsRef.current) soundOppsRef.current.muted = !bgmIsPlaying;
      if (soundComeRef.current) soundComeRef.current.muted = !bgmIsPlaying;
    }
  }, [gameStarted]);

  // 初始化遊戲
  useEffect(() => {
    generateNewTarget();
    const initialFood = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
  }, []);

  // 遊戲開始後才啟動食材生成
  useEffect(() => {
    if (!gameStarted || gameOver) return;

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
    
    // 播放 come 音效
    if (soundComeRef.current) {
      soundComeRef.current.currentTime = 0;
      soundComeRef.current.play().catch((err) => {
        console.warn('播放音效失敗', err);
      });
    }
    
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

  // Add smoke effect function
  const addSmokeEffect = (x, y) => {
    const newSmoke = {
      id: crypto.randomUUID(),
      x,
      y,
      createdAt: Date.now()
    };
    setSmokeEffects(prev => [...prev, newSmoke]);

    // Remove smoke effect after animation
    setTimeout(() => {
      setSmokeEffects(prev => prev.filter(smoke => smoke.id !== newSmoke.id));
    }, 500); // Match this with the animation duration
  };

  // 處理食材掉落動畫
  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (dropAnimationRef.current) {
        cancelAnimationFrame(dropAnimationRef.current);
        dropAnimationRef.current = null;
      }
      return;
    }

    const animate = () => {
      setFallingFoods(prevFoods => {
        const updatedFoods = prevFoods
          .map(food => ({ ...food, y: food.y + 1 }))
          .filter(food => {
            if (food.y >= 660) {
              // Add smoke effect at the exact position where food disappears
              addSmokeEffect(food.x - 40, food.y - 40);
              return false;
            }
            return true;
          });
        
        return updatedFoods;
      });
      
      dropAnimationRef.current = requestAnimationFrame(animate);
    };

    dropAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (dropAnimationRef.current) {
        cancelAnimationFrame(dropAnimationRef.current);
        dropAnimationRef.current = null;
      }
    };
  }, [gameStarted, gameOver]);

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
    
    // 播放音效
    if (correct) {
      goodPlay();
    } else {
      oppsPlay();
    }
    
    // 0.5秒後清除訊息
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
    }, 500);
  };

  // 監控分數變化
  useEffect(() => {
    if (score >= 6 || score <= -6) {
      setGameOver(true);
      setGameResult(score >= 6 ? "恭喜完成！論文進度更近一步！" : "再接再厲，繼續練習！");
      // 遊戲結束時關閉所有音效
      if (bgmRef.current) bgmRef.current.pause();
      if (soundClickRef.current) soundClickRef.current.muted = true;
      if (soundGoodRef.current) soundGoodRef.current.muted = true;
      if (soundOppsRef.current) soundOppsRef.current.muted = true;
      if (soundComeRef.current) soundComeRef.current.muted = true;
      setBgmIsPlaying(false);
    }
  }, [score]);

  // 處理再玩一次
  const handlePlayAgain = () => {
    if (soundClickRef.current) {
      // 先取消靜音以播放點擊音效
      soundClickRef.current.muted = false;
      soundClickRef.current.play().then(() => {
        soundClickRef.current.addEventListener('ended', () => {
          // 重置所有遊戲狀態
          setScore(0);
          setGameOver(false);
          setGameResult("");
          setSkeweredFoods([]);
          setFallingFoods([]);
          setShowMiss(false);
          setShowComboMessage(false);
          setComboMessage("");
          setIsBossGenerating(false);
          setShowCome(false);
          setHasMovedOnce(false);
          
          // 清除所有計時器
          if (moveTimeout.current) {
            clearTimeout(moveTimeout.current);
            moveTimeout.current = null;
          }
          if (missTimeout.current) {
            clearTimeout(missTimeout.current);
            missTimeout.current = null;
          }
          if (comboMessageTimeout.current) {
            clearTimeout(comboMessageTimeout.current);
            comboMessageTimeout.current = null;
          }
          if (dropAnimationRef.current) {
            cancelAnimationFrame(dropAnimationRef.current);
            dropAnimationRef.current = null;
          }
          
          // 重新開啟所有音效
          if (bgmRef.current) {
            bgmRef.current.currentTime = 0;
            bgmRef.current.play();
          }
          if (soundClickRef.current) soundClickRef.current.muted = false;
          if (soundGoodRef.current) soundGoodRef.current.muted = false;
          if (soundOppsRef.current) soundOppsRef.current.muted = false;
          if (soundComeRef.current) soundComeRef.current.muted = false;
          setBgmIsPlaying(true);
          
          // 重新生成目標組合
          generateNewTarget();
          // 重新開始遊戲
          setGameStarted(true);
        }, { once: true });
      }).catch(err => {
        console.warn('播放音效失敗', err);
        // 同樣的重置邏輯，但不包含音效相關的部分
        setScore(0);
        setGameOver(false);
        setGameResult("");
        setSkeweredFoods([]);
        setFallingFoods([]);
        setShowMiss(false);
        setShowComboMessage(false);
        setComboMessage("");
        setIsBossGenerating(false);
        setShowCome(false);
        setHasMovedOnce(false);
        if (moveTimeout.current) clearTimeout(moveTimeout.current);
        if (missTimeout.current) clearTimeout(missTimeout.current);
        if (comboMessageTimeout.current) clearTimeout(comboMessageTimeout.current);
        if (dropAnimationRef.current) cancelAnimationFrame(dropAnimationRef.current);
        generateNewTarget();
        setGameStarted(true);
        generateFood();
      });
    } else {
      // 沒有音效時的重置邏輯
      setScore(0);
      setGameOver(false);
      setGameResult("");
      setSkeweredFoods([]);
      setFallingFoods([]);
      setShowMiss(false);
      setShowComboMessage(false);
      setComboMessage("");
      setIsBossGenerating(false);
      setShowCome(false);
      setHasMovedOnce(false);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      if (missTimeout.current) clearTimeout(missTimeout.current);
      if (comboMessageTimeout.current) clearTimeout(comboMessageTimeout.current);
      if (dropAnimationRef.current) cancelAnimationFrame(dropAnimationRef.current);
      generateNewTarget();
      setGameStarted(true);
      generateFood();
    }
  };

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

  // Loading effect
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  // Add style for smoke animation
  const smokeKeyframes = `
    @keyframes smokeAnimation {
      0% {
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
  `;

  // 初始化 status
  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleFinish = () => {
    // 只有在贏得遊戲時才增加 status，其他情況保持不變
    const delta = score >= 6 ? +1 : 0;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  const quitGame = () => {
    // 直接返回首頁，不改變 status
    if (soundClickRef.current) {
      soundClickRef.current.play().then(() => {
        soundClickRef.current.addEventListener('ended', () => {
          router.push("/");
        }, { once: true });
      }).catch(err => {
        console.warn('播放音效失敗', err);
        router.push("/");
      });
    } else {
      router.push("/");
    }
  };

  // 處理開始遊戲
  const handleStartGame = () => {
    if (soundClickRef.current) {
      soundClickRef.current.play().then(() => {
        soundClickRef.current.addEventListener('ended', () => {
          setGameStarted(true);
          generateFood();
        }, { once: true });
      }).catch(err => {
        console.warn('播放音效失敗', err);
        setGameStarted(true);
        generateFood();
      });
    } else {
      setGameStarted(true);
      generateFood();
    }
  };

  return (
    <div className="flex flex-col items-center bg-black">
      {/* Loading Screen - 修改載入畫面顯示進度 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-t-4 border-b-4 border-white rounded-full animate-spin mb-4"></div>
            <p className="text-white text-xl mb-2">Loading...</p>
            <p className="text-white text-sm">正在載入遊戲資源</p>
          </div>
        </div>
      )}

      {/* 只有在圖片都載入完成後才顯示遊戲內容 */}
      {!isLoading && (
        <>
          {/* 音效 */}
          <audio ref={bgmRef} src="/game8images/bgm.mp3" loop />
          <audio ref={soundClickRef} src="/game8images/soundClick.mp3" />
          <audio ref={soundGoodRef} src="/game8images/soundGood.mp3" />
          <audio ref={soundOppsRef} src="/game8images/soundOpps.mp3" />
          <audio ref={soundComeRef} src="/game8images/come.mp3" />

          {/* 音樂開關按鈕 */}
          <img 
            src={`${bgmIsPlaying ? "/game8images/soundon.png" : "/game8images/soundmuted.png"}`}
            className="w-[30px] cursor-pointer z-50 absolute top-10 right-10"
            onClick={toggleBgm}
          />

          {/* 返回按鈕 */}
          <img 
            src="/game8images/back.png"
            className="w-[30px] cursor-pointer z-50 absolute top-10 left-10"
            onClick={quitGame}
          />

          <div 
            className="relative w-screen h-screen bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/game8images/background.png')",
              minHeight: "100vh"
            }}
          >
            {/* 開始遊戲遮罩 */}
            {!gameStarted && (
              <div className="absolute inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
                <img
                  src="/game8images/start.png"
                  alt="Game Title"
                  className="w-[70%] h-[70%] object-contain mb-[-20px]"
                />
                <div className="flex gap-8">
                  <img
                    src="/game8images/backPress.png"
                    alt="Back to Menu"
                    className="w-[200px] cursor-pointer transition-transform duration-200 hover:translate-y-[5px]"
                    onClick={quitGame}
                  />
                  <img
                    src="/game8images/startPress.png"
                    alt="Start Game"
                    className="w-[200px] cursor-pointer transition-transform duration-200 hover:translate-y-[5px]"
                    onClick={handleStartGame}
                  />
                </div>
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
                className="w-full h-full object-contain"
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
                  left: `${skewerPosition + 200}px`,
                  top: "500px",
                  zIndex: 100,
                  animation: "missAnimation 0.5s ease-out forwards"
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
                  left: `${skewerPosition + index * 80 + 200}px`,
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

            {/* 煙霧特效 */}
            {smokeEffects.map(smoke => (
            <div
                key={smoke.id}
                className="absolute pointer-events-none"
              style={{
                  left: `${smoke.x}px`,
                  top: `${smoke.y}px`,
                  width: '80px',
                  height: '80px',
                  zIndex: 40
              }}
              >
                <img
                  src="/game8images/smoke.png"
                  alt="smoke"
                  className="w-full h-full object-contain"
                  style={{
                    animation: 'smokeAnimation 0.5s ease-out forwards'
                  }}
                />
              </div>
            ))}

            {/* 結束畫面 */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
                <img
                  src={`/game8images/${score >= 6 ? 'win' : 'loss'}.png`}
                  alt="Game Result"
                  className="w-[70%] h-[70%] object-contain mb-[-20px]"
                />
                <div className="flex gap-8">
                  <img
                    src="/game8images/againPress.png"
                    alt="Play Again"
                    className="w-[200px] cursor-pointer transition-transform duration-200 hover:translate-y-[5px]"
                    onClick={handlePlayAgain}
                  />
                  <img
                    src="/game8images/homePress.png"
                    alt="Back to Home"
                    className="w-[200px] cursor-pointer transition-transform duration-200 hover:translate-y-[5px]"
                    onClick={handleFinish}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
        ${smokeKeyframes}
      `}</style>
    </div>
  );
}
