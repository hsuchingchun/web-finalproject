"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const arrowMapping = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
const directions = ["left", "up", "down", "right"];
const arrowTimings = [
  2.1, 4, 5.4, 5.9, 6.9, 8.1, 8.4, 8.9, 11.9, 12.8, 13.6, 14.0, 14.3, 14.5,
  15.8, 16.8, 17.9, 18.3, 18.7, 19.3, 20.3, 21.3, 22.3, 22.7, 23.1, 23.5, 24.4,
  25.3, 26.3, 27, 27.5, 27.8, 29, 29.3, 29.6, 29.9,
];
const ARROW_TRAVEL_TIME = 2.2;

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

const getJudgmentDistance = (zoneRect) => {
  return zoneRect ? zoneRect.height * 0.7 : 70;
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
  const [isDinoFacingRight, setIsDinoFacingRight] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const arrowIdRef = useRef(0);
  const scoreZoneRefs = useRef([null, null, null, null]);
  const intervalRefs = useRef({ arrowMovement: null, arrowCleanup: null });
  const gameFinishedRef = useRef(false);
  const audioRef = useRef(null);
  const introAudioRef = useRef(null);
  const currentScoreRef = useRef(0); // 新增：用來追蹤當前分數

  const clearAllIntervals = useCallback(() => {
    Object.values(intervalRefs.current).forEach((interval) => {
      if (interval) clearInterval(interval);
    });
    intervalRefs.current = { arrowMovement: null, arrowCleanup: null };
  }, []);

  // 更新 currentScoreRef 當 score 改變時
  useEffect(() => {
    currentScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
    const interval = setInterval(
      () => setIsDinoFacingRight((prev) => !prev),
      2000
    );
    return () => clearInterval(interval);
  }, []);

  const handleFinish = useCallback(() => {
    if (gameFinishedRef.current) return;
    gameFinishedRef.current = true;
    clearAllIntervals();
    if (audioRef.current) audioRef.current.pause();
    setGameActive(false);
    setGameOver(true);

    // 使用 ref 來獲取最新的分數值
    const finalScore = currentScoreRef.current;

    if (finalScore >= 100) {
      // 贏的時候 status - 1
      setStatus((prev) => {
        const newStatus = prev - 1;
        localStorage.setItem("status", newStatus.toString());
        return newStatus;
      });
    } else {
      // 輸的時候 status + 1（如果你想要懲罰的話）
      // 或者保持不變（如果只有贏才改變狀態）
      // 根據你的需求選擇以下其中一個：
      // 選項1：輸的時候不改變 status（保持原樣）
      // 什麼都不做
      // 選項2：輸的時候 status + 1（懲罰）
      // setStatus((prev) => {
      //   const newStatus = prev + 1;
      //   localStorage.setItem("status", newStatus.toString());
      //   return newStatus;
      // });
    }
  }, [clearAllIntervals]);

  const startGame = useCallback(() => {
    if (gameActive || gameFinishedRef.current) return;
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    currentScoreRef.current = 0; // 重置分數 ref
    arrowIdRef.current = 0;
    setArrows([]);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    clearAllIntervals();

    intervalRefs.current.arrowMovement = setInterval(() => {
      setArrows((prev) => prev.map((arrow) => ({ ...arrow, y: arrow.y + 10 })));
      const currentTime = audioRef.current?.currentTime ?? 0;
      while (
        arrowIdRef.current < arrowTimings.length &&
        arrowTimings[arrowIdRef.current] - currentTime <= ARROW_TRAVEL_TIME
      ) {
        const newArrow = generateArrow(arrowIdRef.current);
        setArrows((prev) => [...prev, newArrow]);
        arrowIdRef.current++;
      }
    }, 30);

    intervalRefs.current.arrowCleanup = setInterval(() => {
      setArrows((prev) => {
        return prev.map((a) => {
          if (a.status === "falling") {
            const directionIndex = directions.indexOf(a.direction);
            const zoneRect =
              scoreZoneRefs.current[directionIndex]?.getBoundingClientRect();
            if (zoneRect) {
              const zoneY = zoneRect.top + zoneRect.height / 2;
              let arrowHeight =
                a.direction === "up" || a.direction === "down" ? 100 : 50;
              const arrowCenterY = a.y + arrowHeight / 2;
              const judgmentDistance = getJudgmentDistance(zoneRect);
              if (arrowCenterY > zoneY + judgmentDistance && !a.hasPassedZone) {
                setCenterFeedback("miss");
                setTimeout(() => setCenterFeedback(null), 500);
                return { ...a, status: "missed", hasPassedZone: true };
              }
            }
            if (a.y > window.innerHeight * 0.9) {
              return { ...a, status: "missed" };
            }
          }
          return a;
        });
      });
    }, 50);

    const checkEnd = setInterval(() => {
      if (audioRef.current && audioRef.current.ended) {
        clearInterval(checkEnd);
        setTimeout(() => {
          handleFinish();
        }, 1000);
      }
    }, 500);
  }, [gameActive, clearAllIntervals, handleFinish]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) {
        if (e.code === "KeyC") {
          window.location.reload();
        } else if (e.code === "KeyD") {
          router.push("/");
        }
        return;
      }

      if (showIntro && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        setShowIntro(false);
        return;
      }

      if (!showIntro && !gameOver && gameActive) {
        const index = arrowMapping.indexOf(e.key);
        if (index === -1) return;

        const zoneRect = scoreZoneRefs.current[index]?.getBoundingClientRect();
        if (!zoneRect) return;

        const zoneY = zoneRect.top + zoneRect.height / 2;
        const judgmentDistance = getJudgmentDistance(zoneRect);
        const perfectDistance = judgmentDistance * 0.5;

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

        let scoreToAdd = 0;
        let feedbackType = null;
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
            } else if (
              arrowCenterY > zoneY + judgmentDistance &&
              !arrow.hasPassedZone
            ) {
              feedbackType = "miss";
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

        if (hitArrow) {
          setArrows((prev) =>
            prev.map((arrow) =>
              arrow.id === hitArrow.id
                ? { ...arrow, feedback: feedbackType, status: "hit" }
                : arrow
            )
          );
        }

        if (scoreToAdd > 0) {
          setScore((s) => s + scoreToAdd);
        }

        if (feedbackType) {
          setCenterFeedback(feedbackType);
          setTimeout(() => {
            setCenterFeedback(null);
          }, 500);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro, gameActive, gameOver, arrows]);

  useEffect(() => {
    if (!showIntro && !gameActive && !gameFinishedRef.current) {
      startGame();
    }
  }, [showIntro, gameActive, startGame]);

  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  useEffect(() => {
    if (showIntro && introAudioRef.current) {
      introAudioRef.current.currentTime = 0;
      introAudioRef.current.play();
    } else if (!showIntro && introAudioRef.current) {
      introAudioRef.current.pause();
    }
  }, [showIntro]);

  return (
    <div className="bg-[url(/game9/background.png)] h-screen overflow-hidden flex items-center justify-center">
      <audio ref={introAudioRef} src="/game9/intro.mp3" loop />
      <audio ref={audioRef} src="/game9/game9.mp3" />

      {gameOver ? (
        <div className="flex flex-col items-center gap-20">
          <Image
            src={`/game9/${score >= 100 ? "win" : "lose"}.png`}
            alt="game result"
            width={700}
            height={300}
            priority
          />
          <div className="flex gap-30">
            <div className="flex justify-center items-center px-5 text-3xl rounded-4xl border-6 border-[#D7CD77] text-white w-[250px] h-[100px] ">
              按下
              <div className="text-black rounded-md bg-white w-[30px] mx-2 flex justify-center items-center">
                C
              </div>
              鍵重來
            </div>
            <div className="flex justify-center items-center px-5 text-3xl rounded-4xl border-6 border-[#D7CD77] text-white w-[250px] h-[100px] ">
              按下
              <div className="text-black rounded-md bg-white w-[30px] mx-2 flex justify-center items-center">
                D
              </div>
              鍵結束
            </div>
          </div>
        </div>
      ) : showIntro ? (
        <div className="flex flex-col items-center gap-20">
          <Image
            src="/game9/description.png"
            alt="game rule"
            width={940}
            height={508}
            priority
          />
          <div className="flex justify-center items-center px-5 text-3xl rounded-4xl border-6 border-[#D7CD77] text-white w-[310px] h-[100px] animate-bounce">
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
          </p>
          <Image
            src={
              isDinoFacingRight
                ? "/game9/dinasour-r.png"
                : "/game9/dinasour-l.png"
            }
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
                width={centerFeedback === "perfect" ? 250 : 200}
                height={centerFeedback === "Perfect" ? 250 : 200}
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
            src={
              isDinoFacingRight
                ? "/game9/dinasour-l.png"
                : "/game9/dinasour-r.png"
            }
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
