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
    hasPassedZone: false,
  };
}

// 動態計算判定距離的函數
const getJudgmentDistance = (zoneRect) => {
  // 使用判定區域高度的比例來計算，而不是固定70像素
  return zoneRect ? zoneRect.height * 0.7 : 70; // 0.7 可以根據需要調整
};

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
    if (gameFinishedRef.current) return;
    gameFinishedRef.current = true;

    console.log("Game finished! Final score:", score);

    clearAllIntervals();
    setGameActive(false);

    setStatus((prevStatus) => {
      const newStatus = prevStatus - 1;
      localStorage.setItem("status", newStatus.toString());
      console.log("Status updated from", prevStatus, "to", newStatus);
      return newStatus;
    });

    setTimeout(() => {
      router.push("/");
    }, 100);
  }, [score, router, clearAllIntervals]);

  // 開始遊戲的函數
  const startGame = useCallback(() => {
    if (gameActive || gameFinishedRef.current) return;

    console.log("Starting game...");
    setGameActive(true);

    arrowIdRef.current = 0;
    setArrows([]);
    setScore(0);

    clearAllIntervals();

    // 箭頭生成
    intervalRefs.current.arrowGeneration = setInterval(() => {
      const currentId = arrowIdRef.current;
      console.log("Generating arrow:", currentId);

      if (currentId >= 25) {
        clearInterval(intervalRefs.current.arrowGeneration);
        intervalRefs.current.arrowGeneration = null;
        console.log("All arrows generated, waiting for them to exit...");
        return;
      }

      setArrows((prev) => [...prev, generateArrow(currentId)]);
      arrowIdRef.current++;
    }, 1000);

    // 箭頭移動
    intervalRefs.current.arrowMovement = setInterval(() => {
      setArrows((prev) => prev.map((arrow) => ({ ...arrow, y: arrow.y + 10 })));
    }, 30);

    // 修正的箭頭清理和miss檢測
    intervalRefs.current.arrowCleanup = setInterval(() => {
      setArrows((prev) => {
        const updated = prev.map((a) => {
          if (a.status === "falling") {
            const directionIndex = directions.indexOf(a.direction);
            const zoneRect =
              scoreZoneRefs.current[directionIndex]?.getBoundingClientRect();

            if (zoneRect) {
              const zoneY = zoneRect.top + zoneRect.height / 2;
              let arrowHeight =
                a.direction === "up" || a.direction === "down" ? 100 : 50;
              const arrowCenterY = a.y + arrowHeight / 2;

              // 使用動態計算的判定距離
              const judgmentDistance = getJudgmentDistance(zoneRect);

              // 如果箭頭中心剛好超過判定區域，且沒被按過，標記為missed
              if (arrowCenterY > zoneY + judgmentDistance && !a.hasPassedZone) {
                setCenterFeedback("miss");
                setTimeout(() => setCenterFeedback(null), 500);
                return { ...a, status: "missed", hasPassedZone: true };
              }
            }

            // 使用視窗高度的比例來判斷是否完全離開屏幕
            if (a.y > window.innerHeight * 0.9) {
              return { ...a, status: "missed" };
            }
          }
          return a;
        });

        return updated;
      });
    }, 50);
  }, [gameActive, handleFinish, clearAllIntervals]);

  // 修正的鍵盤事件處理
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
      if (!zoneRect) return;

      const zoneY = zoneRect.top + zoneRect.height / 2;
      const judgmentDistance = getJudgmentDistance(zoneRect);
      const perfectDistance = judgmentDistance * 0.5;

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

      // 修正的計分邏輯
      let scoreToAdd = 0;
      let feedbackType = null;

      // 查找可以擊中的箭頭
      const currentArrows = arrows;
      let hitArrow = null;

      for (let i = 0; i < currentArrows.length; i++) {
        const arrow = currentArrows[i];
        if (
          arrow.direction === directions[index] &&
          arrow.status === "falling"
        ) {
          let arrowHeight =
            arrow.direction === "up" || arrow.direction === "down" ? 100 : 50;
          const arrowCenterY = arrow.y + arrowHeight / 2;
          const dy = Math.abs(arrowCenterY - zoneY);

          // 使用動態判定距離
          if (dy <= judgmentDistance) {
            if (dy <= perfectDistance) {
              scoreToAdd = 5;
              feedbackType = "perfect";
              hitArrow = arrow;
            } else {
              scoreToAdd = 3;
              feedbackType = "good";
              hitArrow = arrow;
            }
            break;
          }
          // 箭頭已經過了判定區域（太晚按）
          else if (
            arrowCenterY > zoneY + judgmentDistance &&
            !arrow.hasPassedZone
          ) {
            feedbackType = "miss";
            // 標記這個箭頭為已處理，避免重複miss
            setArrows((prev) =>
              prev.map((a) =>
                a.id === arrow.id
                  ? { ...a, status: "missed", hasPassedZone: true }
                  : a
              )
            );
            break;
          }
        }
      }

      // 更新箭頭狀態
      if (hitArrow) {
        setArrows((prev) =>
          prev.map((arrow) =>
            arrow.id === hitArrow.id
              ? { ...arrow, feedback: feedbackType, status: "hit" }
              : arrow
          )
        );
      }

      // 更新分數
      if (scoreToAdd > 0) {
        setScore((s) => s + scoreToAdd);
      }

      // 顯示反饋（只有在有反饋時才顯示）
      if (feedbackType) {
        setCenterFeedback(feedbackType);
        setTimeout(() => {
          setCenterFeedback(null);
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro, gameActive, arrows]);

  // 當 showIntro 變為 false 時開始遊戲
  useEffect(() => {
    if (!showIntro && !gameActive && !gameFinishedRef.current) {
      console.log("Intro finished, starting game");
      startGame();
    }
  }, [showIntro, gameActive, startGame]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  useEffect(() => {
    if (
      arrowIdRef.current >= 25 &&
      arrows.length === 25 &&
      arrows.every((a) => a.status !== "falling") &&
      !gameFinishedRef.current
    ) {
      console.log("All arrows resolved. Finishing in 1 second...");
      setTimeout(() => {
        handleFinish();
      }, 1000);
    }
  }, [arrows, handleFinish]);

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
          <div className=" flex justify-center items-center px-5 text-3xl rounded-4xl border-6 border-[#D7CD77] text-white w-[310px] h-[100px] animate-bounce">
            按下
            <div className="text-black rounded-md bg-white w-[90px] mx-2 flex justify-center items-center">
              Space
            </div>
            鍵開始
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5 h-full">
          <p className="absolute top-10 left-20 text-4xl font-medium text-white">
            {score}
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
