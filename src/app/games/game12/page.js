"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function IceCreamCatchGame() {
  const playerWidth = 150;
  const playerHeight = 300;
  const iceCreamSize = 100;
  const baseFallSpeed = 7;
  const maxMissCount = 5;

  const iceCreamTypes = [
    { type: "normal", score: 1, image: "/game12/icecream1.png" },
    { type: "high", score: 3, image: "/game12/icecream2.png" },
    { type: "bad", score: -4, image: "/game12/bittermelon.png" },
    { type: "high", score: 3, image: "/game12/icecream4.png" },
    { type: "normal", score: 1, image: "/game12/icecream3.png" },
  ];
  // 音效 refs
  const bgAudioRef = useRef(null);
  const eatIceCreamAudioRef = useRef(null);
  const bitterMelonAudioRef = useRef(null);
  const prevPlayRef = useRef(false);

  // Intro 狀態
  const [showIntro, setShowIntro] = useState(true);

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 400,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });
  const [playerX, setPlayerX] = useState(0);
  const [iceCreams, setIceCreams] = useState([]);
  const [score, setScore] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameFinish, setGameFinish] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [isAngry, setIsAngry] = useState(false);
  const keysPressed = useRef({});

  const router = useRouter();

  // 按 SPACE 開始
  useEffect(() => {
    if (!showIntro) return;
    function handleKeyDown(e) {
      if (e.code === "Space" || e.key === " ") {
        setShowIntro(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIntro]);

  function getRandomIceCreamX() {
    const slotSize = 32;
    const numSlots = Math.floor((windowSize.width - iceCreamSize) / slotSize);
    const slot = Math.floor(Math.random() * numSlots);
    return Math.min(windowSize.width - iceCreamSize, slot * slotSize);
  }

  useEffect(() => {
    setPlayerX(windowSize.width / 2 - playerWidth / 2);
    setIceCreams([]);
  }, [windowSize.width, windowSize.height]);

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      keysPressed.current[e.key] = true;
    }
    function handleKeyUp(e) {
      keysPressed.current[e.key] = false;
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // --- 背景音樂自動播放 & 停止 ---
  useEffect(() => {
    const shouldPlay = !showIntro && !gameOver && !gameFinish;
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (shouldPlay && !prevPlayRef.current) {
      try {
        audio.currentTime = 0;
        audio.volume = 0.66;
        audio.play().catch(() => {});
      } catch (e) {}
    }
    if (!shouldPlay && prevPlayRef.current) {
      audio.pause();
      audio.currentTime = 0;
    }
    prevPlayRef.current = shouldPlay;
  }, [showIntro, gameOver, gameFinish]);

  function playEatIceCream() {
    if (eatIceCreamAudioRef.current) {
      try {
        eatIceCreamAudioRef.current.pause();
        eatIceCreamAudioRef.current.currentTime = 0;
        eatIceCreamAudioRef.current.play().catch(() => {});
      } catch (err) {}
    }
  }
  function playBitterMelon() {
    if (bitterMelonAudioRef.current) {
      try {
        bitterMelonAudioRef.current.pause();
        bitterMelonAudioRef.current.currentTime = 0;
        bitterMelonAudioRef.current.play().catch(() => {});
      } catch (err) {}
    }
  }

  // 定時產生新冰淇淋
  useEffect(() => {
    if (gameOver || gameFinish || showIntro) return;
    const spawner = setInterval(() => {
      const typeIdx = Math.floor(Math.random() * iceCreamTypes.length);
      const type = iceCreamTypes[typeIdx];
      setIceCreams((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: getRandomIceCreamX(),
          y: 0,
          type,
        },
      ]);
    }, 1100);
    return () => clearInterval(spawner);
  }, [gameOver, gameFinish, windowSize.width, windowSize.height, showIntro]);

  // 主遊戲 mover
  useEffect(() => {
    if (gameOver || gameFinish || showIntro) return;
    const mover = setInterval(() => {
      setPlayerX((x) => {
        let nx = x;
        if (keysPressed.current["ArrowLeft"]) {
          nx = Math.max(0, x - 20);
        }
        if (keysPressed.current["ArrowRight"]) {
          nx = Math.min(windowSize.width - playerWidth, x + 15);
        }
        return nx;
      });

      setIceCreams((prevIceCreams) => {
        let nextScore = score;
        let nextMiss = missCount;
        let result = [];

        for (const ice of prevIceCreams) {
          const fall =
            ice.type.type === "high" ? baseFallSpeed * 1.5 : baseFallSpeed;
          const newY = ice.y + fall;

          // 碰撞
          if (
            newY + iceCreamSize >= windowSize.height - playerHeight &&
            ice.x + iceCreamSize >= playerX &&
            ice.x <= playerX + playerWidth
          ) {
            nextScore += ice.type.score;
            if (ice.type.type === "bad") {
              nextMiss += 1;
              setIsAngry(true);
              setTimeout(() => setIsAngry(false), 500);
              playBitterMelon();
            } else {
              setIsEating(true);
              setTimeout(() => setIsEating(false), 500);
              playEatIceCream();
            }
            continue;
          }

          // 沒接到且剛掉出去
          if (ice.y <= windowSize.height && newY > windowSize.height) {
            if (ice.type.score > 0) {
              nextMiss += 1;
            }
            continue;
          }

          result.push({ ...ice, y: newY });
        }

        // 統一 setState
        if (nextScore !== score) {
          if (nextScore < 0) {
            setScore(nextScore);
            setGameOver(true);
            return [];
          }
          if (nextScore >= 40) {
            setScore(nextScore);
            setGameFinish(true);
            return [];
          }
          setScore(nextScore);
        }
        if (nextMiss !== missCount) {
          if (nextMiss >= maxMissCount) {
            setMissCount(nextMiss);
            setGameOver(true);
            return [];
          }
          setMissCount(nextMiss);
        }

        return result;
      });
    }, 30);

    return () => clearInterval(mover);
  }, [
    gameOver,
    gameFinish,
    windowSize.width,
    windowSize.height,
    playerX,
    playerWidth,
    playerHeight,
    iceCreamSize,
    baseFallSpeed,
    maxMissCount,
    score,
    missCount,
    showIntro,
  ]);

  // 回主頁，只有破關才+1
  const handleFinish = () => {
    if (gameFinish) {
      const prevStatus = parseInt(localStorage.getItem("status") ?? "0", 10);
      const newStatus = prevStatus + 1;
      localStorage.setItem("status", newStatus.toString());
    }
    router.push("/");
  };

  function restartGame() {
    setScore(0);
    setMissCount(0);
    setGameOver(false);
    setGameFinish(false);
    setPlayerX(windowSize.width / 2 - playerWidth / 2);
    setIceCreams([]);
    setIsEating(false);
    setIsAngry(false);
  }

  // Score UI - 左上角
  function renderScoreUI() {
    return (
      <div
        style={{
          fontFamily: "Aura",
          position: "fixed",
          top: 24,
          left: 24,
          zIndex: 100,
          background: "rgba(255,255,255,0.7)",
          borderRadius: 10,
          padding: "6px 22px 6px 10px",
          fontSize: 28,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <img
          src="/game12/score.png"
          alt="score"
          style={{
            width: 45,
            height: 45,
            marginRight: 7,
            verticalAlign: "middle",
          }}
          draggable={false}
        />
        <span>score: {score}</span>
      </div>
    );
  }

  // missCount UI - 右上角
  function renderMissUI() {
    let arr = [];
    for (let i = 0; i < maxMissCount; i++) {
      arr.push(
        <img
          key={i}
          src={
            i < missCount
              ? "/game12/player_angry.png"
              : "/game12/player_defaultangry.png"
          }
          alt={i < missCount ? "生氣" : "預備生氣"}
          style={{
            width: 38,
            height: 38,
            marginLeft: 6,
            objectFit: "contain",
          }}
          draggable={false}
        />
      );
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 100,
          alignItems: "center",
        }}
      >
        {arr}
      </div>
    );
  }

  // 結算/失敗視窗
  function renderOverlayDialog() {
    if (!gameOver && !gameFinish) return null;

    let title = "";
    let content = "";
    let bgColor = "white";
    let color = "#222";

    if (gameFinish) {
      title = "雖然寫論文很燒腦，但是吃冰淇淋可以解決一切煩惱：）";
      content = `最終分數：${score}`;
      bgColor = "rgba(40,40,40,0.6)";
      color = "white";
    } else if (gameOver) {
      title = "寫論文已經夠苦了，還一直吃不到冰淇淋...";
      content = `最終分數：${score}`;
      bgColor = "rgba(40,40,40,0.6)";
      color = "white";
    }

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Aura",
            boxShadow: "0 0 32px #bbb6",
            borderRadius: 24,
            background: bgColor,
            color,
            minWidth: 0,
            minHeight: 0,
            maxWidth: "90vw",
            maxHeight: "90vh",
            padding: "44px 32px 32px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              marginBottom: 20,
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          <div
            style={{
              margin: "16px 0 26px 0",
              fontSize: 24,
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {content}
          </div>
          <button
            onClick={restartGame}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "14px 20px",
              fontSize: 22,
              fontFamily: "Aura",
              border: "4px solid #fffab0",
              borderRadius: 12,
              boxShadow: "0 0 16px 3px #ffe77788",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              marginBottom: 18,

              letterSpacing: "1.2px",
            }}
          >
            重新開始遊戲
          </button>
          <button
            onClick={handleFinish}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "14px 20px",
              fontSize: 22,
              fontFamily: "Aura",
              border: "4px solid #fffab0",
              borderRadius: 12,
              boxShadow: "0 0 16px 3px #ffe77788",
              background: "transparent",
              color: "white",
              cursor: "pointer",

              letterSpacing: "1.2px",
            }}
          >
            回到主頁
          </button>
        </div>
      </div>
    );
  }

  // Intro
  function renderIntro() {
    if (!showIntro) return null;
    const aqua = "#6fbcc5";
    const circleStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: aqua,
      color: "#fff",
      fontWeight: "bold",
      fontSize: 20,
      marginRight: 10,
      verticalAlign: "middle",
      flexShrink: 0,
      fontFamily: "Aura",
    };

    // 圖片icon樣式
    const iconStyle = {
      width: 30,
      height: 30,
      margin: "0 5px -5px 0",
      objectFit: "contain",
      display: "inline-block",
      verticalAlign: "middle",
      userSelect: "none",
    };

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.48)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: "Aura",
              background: "#F4F4EB",
              borderRadius: 24,
              boxShadow: "0 0 40px #0005",
              padding: "48px 40px 48px 40px",
              minWidth: 480,
              maxWidth: 580,
              textAlign: "left",
              fontSize: 22,
              lineHeight: 1.5,
              color: "#222",
              position: "relative",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: 28,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              遊戲規則說明
            </div>

            <div
              style={{
                marginBottom: 18,
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <span style={circleStyle}>1</span>
              <span>
                讓玩家吃足夠冰淇淋，吃到分數40分就心滿意足遊戲結束，過程中會有
                <img
                  src="/game12/bittermelon.png"
                  alt="苦瓜"
                  style={{ ...iconStyle, margin: "0 0px 0px 4px" }}
                />
                苦瓜，小心不要讓他吃到了！
              </span>
            </div>

            <div
              style={{
                marginBottom: 18,
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <span style={circleStyle}>2</span>
              <span>
                只要玩家沒吃到冰淇淋，或是吃到苦瓜，都會累積不滿意分數
                <img
                  src="/game12/player_angry.png"
                  alt="不滿意"
                  style={{ ...iconStyle, margin: "0 0px 0px 4px" }}
                />
                ，累計五次不滿意分數或分數負分則遊戲結束。
              </span>
            </div>

            <div
              style={{
                marginBottom: 0,
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <span style={circleStyle}>3</span>
              <span>
                人物操作方式：方向鍵
                <img
                  src="/game12/left.png"
                  alt="左鍵"
                  style={{
                    width: 36,
                    height: 36,
                    margin: "0 6px 0px 12px",
                    verticalAlign: "middle",
                    userSelect: "none",
                    display: "inline-block",
                  }}
                  draggable={false}
                />
                <img
                  src="/game12/right.png"
                  alt="右鍵"
                  style={{
                    width: 36,
                    height: 36,
                    margin: "0 0px 0px 2px",
                    verticalAlign: "middle",
                    userSelect: "none",
                    display: "inline-block",
                  }}
                  draggable={false}
                />
                <br />
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <img
                    src="/game12/icecream2.png"
                    alt="冰淇淋"
                    style={iconStyle}
                  />
                  冰淇淋：+3　
                  <img
                    src="/game12/icecream1.png"
                    alt="冰棒"
                    style={iconStyle}
                  />
                  冰棒：+1　
                  <img
                    src="/game12/bittermelon.png"
                    alt="苦瓜"
                    style={iconStyle}
                  />
                  苦瓜：-4
                </span>
              </span>
            </div>
          </div>

          {/* space 按鈕（下方） */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                padding: "10px 30px",
                borderRadius: 14,
                border: "3px solid #fffab0",
                boxShadow: "0 0 12px 3px #ffe77788",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 28,
                letterSpacing: "1.2px",
                fontWeight: "bold",
              }}
            >
              按{" "}
              <span
                style={{
                  display: "inline-block",
                  background: "#fff",
                  color: "#222",
                  borderRadius: 8,
                  padding: "0 10px",
                  margin: "0 5px",
                  fontSize: 32,

                  boxShadow: "0 0 4px #fff",
                }}
              >
                SPACE
              </span>{" "}
              開始遊戲
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 全螢幕背景 */}
      <img
        src="/game12/bg.png"
        alt="背景"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />

      {/* 左上角分數 */}
      {renderScoreUI()}

      {/* 右上角 missCount */}
      {renderMissUI()}

      {/* 說明畫面 */}
      {renderIntro()}

      {/* overlay dialog */}
      {renderOverlayDialog()}

      {/* 遊戲主體 */}
      {!showIntro && (
        <div
          tabIndex={0}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            outline: "none",
            zIndex: 1,
            backgroundColor: "transparent",
            overflow: "hidden",
          }}
        >
          {!gameOver && !gameFinish && (
            <>
              {/* 玩家圖片 */}
              <img
                src={
                  isAngry
                    ? "/game12/player_disgusting.png"
                    : isEating
                    ? "/game12/player_eat.png"
                    : "/game12/player.png"
                }
                alt="玩家"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: playerX,
                  width: playerWidth,
                  height: playerHeight,
                  zIndex: 2,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />

              {/* 多顆冰淇淋 */}
              {iceCreams.map((ice) => (
                <img
                  key={ice.id}
                  src={ice.type.image}
                  alt="冰淇淋"
                  style={{
                    position: "absolute",
                    top: ice.y,
                    left: ice.x,
                    width: iceCreamSize,
                    height: iceCreamSize,
                    zIndex: 2,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              ))}
            </>
          )}
        </div>
      )}
      {/* ----- 音樂/音效播放器 ----- */}
      <audio
        ref={bgAudioRef}
        src="/game12/bg.mp3"
        loop
        preload="auto"
        style={{ display: "none" }}
      />
      <audio
        ref={eatIceCreamAudioRef}
        src="/game12/eaticecream.mp3"
        preload="auto"
        style={{ display: "none" }}
      />
      <audio
        ref={bitterMelonAudioRef}
        src="/game12/bittermelon.mp3"
        preload="auto"
        style={{ display: "none" }}
      />
    </>
  );
}
