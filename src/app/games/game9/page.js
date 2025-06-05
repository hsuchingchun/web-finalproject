"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const arrowMapping = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
const directions = ["left", "up", "down", "right"];

function getRandomDirection() {
  const i = Math.floor(Math.random() * 4);
  return directions[i];
}

function generateArrow(id) {
  return {
    id,
    y: -60,
    direction: getRandomDirection(),
    status: "falling",
    feedback: null,
  };
}

export default function Game9() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [score, setScore] = useState(0);
  const [arrows, setArrows] = useState([]);
  const [hitEffects, setHitEffects] = useState([false, false, false, false]);
  const [gameActive, setGameActive] = useState(false);
  const [centerFeedback, setCenterFeedback] = useState(null);

  const arrowIdRef = useRef(0);
  const scoreZoneRefs = useRef([null, null, null, null]);
  const intervalRefs = useRef({
    arrowGeneration: null,
    arrowMovement: null,
    arrowCleanup: null,
  });
  const gameFinishedRef = useRef(false);
  const keyHandlerRef = useRef(null);

  // 清理所有 intervals 的函數
  const clearAllIntervals = useCallback(() => {
    Object.values(intervalRefs.current).forEach((interval) => {
      if (interval) clearInterval(interval);
    });
    intervalRefs.current = {
      arrowGeneration: null,
      arrowMovement: null,
      arrowCleanup: null,
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleFinish = useCallback(() => {
    if (gameFinishedRef.current) return; // 防止重複執行
    gameFinishedRef.current = true;

    console.log("Game finished! Final score:", score); // 調試用

    clearAllIntervals();
    setGameActive(false);

    // 使用當前的狀態值
    setStatus((prevStatus) => {
      const newStatus = prevStatus - 1;
      localStorage.setItem("status", newStatus.toString());
      console.log("Status updated from", prevStatus, "to", newStatus); // 調試用
      return newStatus;
    });

    // 延遲跳轉，確保狀態更新完成
    setTimeout(() => {
      router.push("/");
    }, 100);
  }, [score, router, clearAllIntervals]);

  // 開始遊戲的函數
  const startGame = useCallback(() => {
    if (gameActive || gameFinishedRef.current) return;

    console.log("Starting game..."); // 調試用
    setGameActive(true);

    // 重置遊戲狀態
    arrowIdRef.current = 0;
    setArrows([]);
    setScore(0);

    // 清理之前的 intervals（以防萬一）
    clearAllIntervals();

    // 箭頭生成
    intervalRefs.current.arrowGeneration = setInterval(() => {
      const currentId = arrowIdRef.current;
      console.log("Generating arrow:", currentId); // 調試用

      if (currentId >= 25) {
        clearInterval(intervalRefs.current.arrowGeneration);
        intervalRefs.current.arrowGeneration = null;
        console.log("All arrows generated, finishing game..."); // 調試用
        handleFinish();
        return;
      }

      setArrows((prev) => [...prev, generateArrow(currentId)]);
      arrowIdRef.current++;
    }, 1000);

    // 箭頭移動
    intervalRefs.current.arrowMovement = setInterval(() => {
      setArrows((prev) => prev.map((arrow) => ({ ...arrow, y: arrow.y + 10 })));
    }, 30);

    // 箭頭清理（錯過的箭頭）
    intervalRefs.current.arrowCleanup = setInterval(() => {
      setArrows((prev) =>
        prev.map((a) => {
          if (a.status === "falling" && a.y > 650) {
            return { ...a, status: "missed" };
          }
          return a;
        })
      );
    }, 300);
  }, [gameActive, handleFinish, clearAllIntervals]);

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntro && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        setShowIntro(false);
        return;
      }

      const index = arrowMapping.indexOf(e.key);
      if (index === -1 || showIntro || !gameActive) return;

      const zoneRect = scoreZoneRefs.current[index]?.getBoundingClientRect();
      const zoneY = zoneRect.top + zoneRect.height / 2;

      // 擊中效果
      setHitEffects((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      setTimeout(() => {
        setHitEffects((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
      }, 300);

      // 計分邏輯 - 修正部分
      let scoreToAdd = 0;

      setArrows((prev) => {
        let updated = [...prev];
        let hasScored = false;

        for (let i = 0; i < updated.length; i++) {
          const arrow = updated[i];
          if (
            arrow.direction === directions[index] &&
            arrow.status === "falling"
          ) {
            let arrowHeight =
              arrow.direction === "up" || arrow.direction === "down" ? 100 : 50;
            const arrowCenterY = arrow.y + arrowHeight / 2;
            const dy = Math.abs(arrowCenterY - zoneY);

            if (dy <= 70) {
              if (dy <= 35) {
                updated[i] = { ...arrow, feedback: "perfect" };
                hasScored = "perfect";
              } else {
                updated[i] = { ...arrow, feedback: "good" };
                hasScored = "good";
              }
              break;
            }
          }
        }

        // 在這裡直接更新分數
        if (hasScored === "perfect") {
          setScore((s) => s + 5);
          setCenterFeedback("perfect");
        } else if (hasScored === "good") {
          setScore((s) => s + 3);
          setCenterFeedback("good");
        } else {
          setCenterFeedback("miss");
        }

        if (hasScored) {
          setTimeout(() => {
            setCenterFeedback(null);
          }, 500); // 顯示 0.5 秒
        }

        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro, gameActive]);

  // 當 showIntro 變為 false 時開始遊戲
  useEffect(() => {
    if (!showIntro && !gameActive && !gameFinishedRef.current) {
      console.log("Intro finished, starting game"); // 調試用
      startGame();
    }
  }, [showIntro, gameActive, startGame]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return (
    <div className="bg-[url(/game9/background.png)] h-screen overflow-hidden flex items-center justify-center">
      {showIntro ? (
        <div className="flex flex-col items-center gap-20">
          <Image
            src="/game9/description.png"
            alt="game rule"
            width={940}
            height={508}
            priority
          />
          <Image
            src="/game9/start.png"
            alt="game start"
            width={310}
            height={100}
            className="animate-bounce"
          />
        </div>
      ) : (
        <div className="flex items-center gap-5 h-full">
          <p className="absolute top-10 left-20 text-4xl font-medium text-white">
            {score} {/* 調試用 - 顯示遊戲狀態 */}
            <span className="text-sm block">
              Arrows: {arrowIdRef.current}/25
            </span>
          </p>
          <Image
            src="/game9/dinasour-l.png"
            alt="dinasour left"
            width={185}
            height={230}
            className="absolute left-20"
          />
          {centerFeedback && (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-50">
              <Image
                src={`/game9/${centerFeedback}.png`}
                alt={centerFeedback}
                width={200}
                height={200}
              />
            </div>
          )}
          {directions.map((dir, i) => (
            <div className="relative flex justify-center h-full" key={dir}>
              <Image
                src="/game9/track.png"
                alt="track"
                width={100}
                height={700}
                style={{ height: "100vh", width: "100px" }}
                className="z-0"
              />
              {hitEffects[i] && (
                <div className="absolute bottom-[100px] w-[80px] h-[80px] bg-yellow-400 opacity-50 rounded-full animate-ping z-20"></div>
              )}
              <Image
                ref={(el) => (scoreZoneRefs.current[i] = el)}
                src="/game9/scoreArea-1.png"
                alt="score area"
                width={100}
                height={100}
                className="absolute z-10 bottom-[80px]"
              />
              {arrows
                .filter((a) => a.direction === dir)
                .map((a) => {
                  const isVertical =
                    a.direction === "up" || a.direction === "down";
                  const wrapperClass = isVertical
                    ? "w-[70px] h-[100px]"
                    : "w-[80px] h-[50px]";

                  return (
                    <div
                      key={a.id}
                      style={{
                        position: "absolute",
                        top: `${a.y}px`,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                      className="z-20 transition-all duration-75"
                    >
                      {/* {a.feedback && (
                        <div
                          className={`absolute inset-0 rounded-full ${
                            a.feedback === "perfect"
                              ? "bg-yellow-300"
                              : "bg-blue-300"
                          } animate-ping opacity-50`}
                        />
                      )} */}

                      <div
                        className={`${wrapperClass} flex items-center justify-center`}
                      >
                        <Image
                          src={`/game9/${a.direction}.png`}
                          alt={`arrow ${a.direction}`}
                          width={100}
                          height={100}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
          <Image
            src="/game9/dinasour-r.png"
            alt="dinasour right"
            width={185}
            height={230}
            className="absolute right-20"
          />
        </div>
      )}
    </div>
  );
}
