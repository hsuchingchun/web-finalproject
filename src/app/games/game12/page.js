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

  // 狀態與 ref
  const [showIntro, setShowIntro] = useState(true);
  const [showInfo, setShowInfo] = useState(false); // info 規則彈窗
  const [isPaused, setIsPaused] = useState(false);
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

  // 音效 refs
  const bgAudioRef = useRef(null);
  const eatIceCreamAudioRef = useRef(null);
  const bitterMelonAudioRef = useRef(null);
  const prevPlayRef = useRef(false);
  const [muted, setMuted] = useState(false);

  const router = useRouter();

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
    if (gameOver || gameFinish || showIntro || showInfo || isPaused) return;
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
  }, [
    gameOver,
    gameFinish,
    windowSize.width,
    windowSize.height,
    showIntro,
    showInfo,
    isPaused,
  ]);

  // 主遊戲 mover
  useEffect(() => {
    if (gameOver || gameFinish || showIntro || showInfo || isPaused) return;
    const mover = setInterval(() => {
      setPlayerX((x) => {
        let nx = x;
        if (keysPressed.current["ArrowLeft"]) {
          nx = Math.max(0, x - 20);
        }
        if (keysPressed.current["ArrowRight"]) {
          nx = Math.min(windowSize.width - playerWidth, x + 20);
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
          if (nextScore >= 30) {
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
    showInfo,
    isPaused,
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <button
              onClick={restartGame}
              style={{
                cursor: "pointer",
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "12px 24px",
                borderRadius: 12,
                border: "3px solid #E6EBDC",
                boxShadow: "0 0 12px 3px #618A97",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 24,
                letterSpacing: "1.2px",
                fontWeight: "bold",
                marginBottom: 8,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              重新遊玩
            </button>
            <button
              onClick={handleFinish}
              style={{
                cursor: "pointer",
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "12px 24px",
                borderRadius: 12,
                border: "3px solid #E6EBDC",
                boxShadow: "0 0 12px 3px #618A97",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 24,
                letterSpacing: "1.2px",
                fontWeight: "bold",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              回到首頁
            </button>
          </div>
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
                這是一個讓你吃冰淇淋吃到飽的遊戲，吃到分數30分就心滿意足遊戲結束，過程中會有
                <img
                  src="/game12/bittermelon.png"
                  alt="苦瓜"
                  style={{ ...iconStyle, margin: "0 0px 0px 4px" }}
                />
                苦瓜，小心不要吃到了！
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
                只要你沒吃到冰淇淋，或是吃到苦瓜，都會累積不滿意分數
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
              alignItems: "center",
              width: 400,
            }}
          >
            <button
              onClick={() => setShowIntro(false)}
              style={{
                cursor: "pointer",
                display: "block", // 讓 span 佔滿外層寬度
                width: "100%",
                textAlign: "center",
                padding: "10px 30px",
                borderRadius: 14,
                border: "3px solid #E6EBDC",
                boxShadow: "0 0 12px 3px #618A97",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 24,
                letterSpacing: "1.2px",
                fontWeight: "bold",
              }}
            >
              開始遊戲
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 14,
              width: 400,
            }}
          >
            <button
              onClick={() => router.push("/")}
              style={{
                cursor: "pointer",
                display: "block", // 讓 span 佔滿外層寬度
                width: "100%",
                textAlign: "center",
                padding: "8px 24px",
                borderRadius: 12,
                border: "3px solid #E6EBDC",
                boxShadow: "0 0 12px 3px #618A97",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 24,
                letterSpacing: "1.2px",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // info modal
  function renderInfoModal() {
    if (!showInfo) return null;
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
                這是一個讓你吃冰淇淋吃到飽的遊戲，吃到分數30分就心滿意足遊戲結束，過程中會有
                <img
                  src="/game12/bittermelon.png"
                  alt="苦瓜"
                  style={{ ...iconStyle, margin: "0 0px 0px 4px" }}
                />
                苦瓜，小心不要吃到了！
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
                只要你沒吃到冰淇淋，或是吃到苦瓜，都會累積不滿意分數
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 400,
            }}
          >
            <button
              style={{
                cursor: "pointer",
                display: "block", // 讓 span 佔滿外層寬度
                width: "100%",
                textAlign: "center",
                padding: "10px 30px",
                borderRadius: 14,
                border: "3px solid #E6EBDC",
                boxShadow: "0 0 12px 3px #618A97",
                background: "rgba(0,0,0,0)",
                color: "#fff",
                fontFamily: "Aura",
                fontSize: 24,
                letterSpacing: "1.2px",
                fontWeight: "bold",
              }}
              onClick={() => setShowInfo(false)}
            >
              繼續遊戲
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPauseOverlay() {
    if (!isPaused) return null;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.48)",
          zIndex: 11000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "Aura",
            color: "#fff",
            fontSize: 38,
            fontWeight: "bold",
            letterSpacing: 2,
            textShadow: "0 2px 16px #0009",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          遊戲已暫停
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            justifyContent: "center",
            marginTop: 14,
            width: 400,
          }}
        >
          {/* P: 繼續遊戲 */}
          <button
            style={{
              cursor: "pointer",
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "10px 24px",
              borderRadius: 12,
              border: "3px solid #E6EBDC",
              boxShadow: "0 0 12px 3px #618A97",
              background: "rgba(0,0,0,0)",
              color: "#fff",
              fontFamily: "Aura",
              fontSize: 24,
              letterSpacing: "1.2px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: 4,
              userSelect: "none",
            }}
            onClick={() => setIsPaused(false)}
          >
            繼續遊戲
          </button>
          {/* C: 回到首頁 */}
          <button
            style={{
              cursor: "pointer",
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "10px 24px",
              borderRadius: 12,
              border: "3px solid #E6EBDC",
              boxShadow: "0 0 12px 3px #618A97",
              background: "rgba(0,0,0,0)",
              color: "#fff",
              fontFamily: "Aura",
              fontSize: 24,
              letterSpacing: "1.2px",
              fontWeight: "bold",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={handleFinish}
          >
            回到首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 全螢幕背景 */}
      <input
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0,
          zIndex: 20000,
          pointerEvents: "none",
        }}
        aria-hidden="true"
        tabIndex={-1}
      />
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

      {/* Intro 遊戲說明（初次或呼叫） */}
      {renderIntro()}
      {renderInfoModal()}

      {/* 遊戲結算/失敗彈窗 */}
      {renderOverlayDialog()}

      {/* 暫停遮罩 */}
      {renderPauseOverlay()}

      {/* 右下角 info & 暫停按鈕 */}
      {!showIntro && !gameOver && !gameFinish && !isPaused && !showInfo && (
        <div
          style={{
            position: "fixed",
            right: 26,
            bottom: 38,
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <button
            onClick={() => setShowInfo(true)}
            aria-label="遊戲說明"
            style={{
              cursor: "pointer",
              width: 62,
              height: 62,
              border: "none",
              background: "rgba(255,255,255,0.67)",
              borderRadius: "50%",
              boxShadow: "0 2px 18px #8886",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <img
              src="/game12/info.png"
              alt="說明"
              style={{ width: 36, height: 36 }}
              draggable={false}
            />
          </button>
          <button
            onClick={() => setIsPaused(true)}
            aria-label={isPaused ? "繼續遊戲" : "暫停遊戲"}
            style={{
              cursor: "pointer",
              width: 62,
              height: 62,
              border: "none",
              background: "rgba(255,255,255,0.67)",
              borderRadius: "50%",
              boxShadow: "0 2px 18px #8886",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <img
              src="/game12/pause.png"
              alt="暫停"
              style={{ width: 36, height: 36, opacity: isPaused ? 0.45 : 1 }}
              draggable={false}
            />
          </button>
          <button
            tabIndex={-1}
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "打開音效" : "關閉音效"}
            style={{
              width: 62,
              height: 62,
              border: "none",
              background: "rgba(255,255,255,0.67)",
              borderRadius: "50%",
              boxShadow: "0 2px 18px #8886",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <img
              src={muted ? "/game12/sound-off.png" : "/game12/sound-on.png"}
              alt={muted ? "音效已關閉" : "音效已開啟"}
              style={{ width: 36, height: 36, opacity: muted ? 0.45 : 1 }}
              draggable={false}
            />
          </button>
        </div>
      )}

      {/* 遊戲主畫面（不顯示於intro/gameover/結束/暫停） */}
      {!showIntro && !gameOver && !gameFinish && !isPaused && (
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
          {/* 玩家 */}
          <img
            src={
              isAngry
                ? "/game12/player_disgusting.png"
                : isEating
                ? "/game12/player_eat.png"
                : "/game12/player.png"
            }
            alt="主角"
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
        </div>
      )}

      {/* ----- 音樂/音效播放器 ----- */}
      <audio
        ref={bgAudioRef}
        src="/game12/bg.mp3"
        loop
        preload="auto"
        style={{ display: "none" }}
        muted={muted}
      />
      <audio
        ref={eatIceCreamAudioRef}
        src="/game12/eaticecream.mp3"
        preload="auto"
        style={{ display: "none" }}
        muted={muted}
      />
      <audio
        ref={bitterMelonAudioRef}
        src="/game12/bittermelon.mp3"
        preload="auto"
        style={{ display: "none" }}
        muted={muted}
      />
    </>
  );
}
