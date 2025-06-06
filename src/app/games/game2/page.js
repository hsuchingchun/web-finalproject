"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = ["#f44336", "#ff9800", "#4caf50", "#2196f3"];
const CUP_WIDTH = 72;

export default function Game2() {
  const [timeLeft, setTimeLeft] = useState(60);
  const router = useRouter();
  const canvasRef = useRef(null);
  const [bubbles, setBubbles] = useState([]);
  const [shooting, setShooting] = useState(null);
  const [nextColor, setNextColor] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [paused, setPaused] = useState(false);
  const [comboText, setComboText] = useState(null);
  const [cupX, setCupX] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [gameResult, setGameResult] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const shooterImg = useRef(null);
  const bgImage = useRef(null);
  const [status, setStatus] = useState(0);
  const lastFallTimeRef = useRef(Date.now());
  const popSound = useRef(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
    popSound.current = new Audio("/game2/pop.mp3");
  }, []);

  const playPop = () => {
    if (popSound.current) {
      popSound.current.currentTime = 0;
      popSound.current.play();
    }
  };

  const handleFinish = () => {
  const delta = 1;
  const newStatus = status + delta;
  localStorage.setItem("status", newStatus);
  setTimeout(() => {
    router.push("/");
  }, 2000); // 延遲 2 秒跳轉，讓使用者看到得分畫面
};

  useEffect(() => {
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    bgImage.current = new Image();
    bgImage.current.src = "/game2/bg.png";
  }, []);

  useEffect(() => {
    if (canvasSize.width > 0) {
      setCupX(canvasSize.width / 2);
    }
  }, [canvasSize.width]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      setCupX((prev) => {
        const step = 16;
        if (e.key === "ArrowLeft") {
          return Math.max(prev - step, CUP_WIDTH / 2 + 16);
        } else if (e.key === "ArrowRight") {
          return Math.min(prev + step, canvasSize.width - CUP_WIDTH / 2 - 16);
        }
        return prev;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasSize]);

  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;
    const initial = [];
    const totalCols = Math.floor(canvasSize.width / 48) - 4;
    for (let row = 0; row < 4; row++) {
      const cols = row % 2 === 0 ? totalCols : totalCols - 1;
      const offsetX = row % 2 === 0 ? 0 : 24;
      for (let col = 0; col < cols; col++) {
        initial.push({
          x: col * 48 + offsetX + (canvasSize.width - totalCols * 48) / 2,
          y: row * 42 + 40,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
      }
    }
    setBubbles(initial);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }, [canvasSize]);

  const drawBubble = useCallback((ctx, x, y, color) => {
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#00000055";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 8, y - 8, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff88";
    ctx.fill();
  }, []);

  const renderScene = useCallback((ctx) => {
    if (bgImage.current?.complete) {
      ctx.drawImage(bgImage.current, 0, 0, canvasSize.width, canvasSize.height);
    } else {
      ctx.fillStyle = "#90caf9";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    for (const b of bubbles) {
      drawBubble(ctx, b.x, b.y, b.color);
    }

    if (shooting) {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          shooting.x - shooting.dx * i * 5,
          shooting.y - shooting.dy * i * 5,
          2, 2
        );
      }
      drawBubble(ctx, shooting.x, shooting.y, shooting.color);
    }

    const cupY = canvasSize.height - 96;

    if (shooterImg.current?.complete) {
      ctx.drawImage(shooterImg.current, cupX - CUP_WIDTH / 2, cupY, CUP_WIDTH, 96);
    }

    if (nextColor) {
      drawBubble(ctx, cupX + 7, cupY - 16, nextColor);
    }

    ctx.fillStyle = "#1a237e";
    ctx.fillRect(0, 0, 16, canvasSize.height);
    ctx.fillRect(canvasSize.width - 16, 0, 16, canvasSize.height);
  }, [bubbles, shooting, nextColor, canvasSize, drawBubble, cupX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderScene(ctx);
  }, [renderScene]);

  useEffect(() => {
    if (paused || !shooting || showIntro || gameResult) return;
    const interval = setInterval(() => {
      setShooting((prev) => {
        if (!prev) return null;
        let newX = prev.x + prev.dx;
        let newY = prev.y + prev.dy;
        if (newX <= 24 || newX >= canvasSize.width - 24) {
          prev.dx *= -1;
          newX = prev.x + prev.dx;
        }
        const hit = bubbles.some((b) => Math.hypot(b.x - newX, b.y - newY) < 48);
        if (newY <= 0 || hit) {
          const newBubble = { x: newX, y: newY, color: prev.color };
          const updatedBubbles = [...bubbles, newBubble];
          const removed = removeMatchingBubbles(updatedBubbles, newBubble);
          const removedCount = updatedBubbles.length - removed.length;
          if (removedCount >= 3) {
            playPop();
            const gained = 10 + (removedCount - 3) * 2;
            setScore((prevScore) => prevScore + gained);
            setComboText("+" + gained);
            setTimeout(() => setComboText(null), 1000);
          }
          setBubbles(removed);
          setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
          setStepCount((count) => count + 1);
          return null;
        }
        return { ...prev, x: newX, y: newY };
      });
    }, 16);
    return () => clearInterval(interval);
  }, [shooting, bubbles, paused, showIntro, gameResult]);

  useEffect(() => {
    let frameId;
    const loop = () => {
      const now = Date.now();
      if (!paused && !showIntro && !gameResult && now - lastFallTimeRef.current >= 15000) {
        setBubbles((prev) => {
          const moved = prev.map((b) => ({ ...b, y: b.y + 48 }));
          const touchBottom = moved.some((b) => b.y + 16 >= canvasSize.height - 96);
          if (touchBottom) {
            setGameResult("Game Over");
            setFinalScore(score);
            return prev;
          }
          return moved;
        });
        lastFallTimeRef.current = now;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [paused, showIntro, gameResult, canvasSize.height, score]);

  useEffect(() => {
    if (paused || showIntro || gameResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinalScore(scoreRef.current);
  setTimeout(() => setGameResult("Time's Up"), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, showIntro, gameResult]);

  const removeMatchingBubbles = (all, target) => {
    const visited = new Set();
    const queue = [target];
    const match = [target];
    while (queue.length > 0) {
      const current = queue.pop();
      visited.add(current);
      for (const b of all) {
        if (!visited.has(b) && b.color === target.color && Math.hypot(b.x - current.x, b.y - current.y) < 50) {
          queue.push(b);
          match.push(b);
          visited.add(b);
        }
      }
    }
    return match.length >= 3 ? all.filter(b => !match.includes(b)) : all;
  };

  const handleShoot = (e) => {
    if (paused || shooting || showIntro || gameResult) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = cupX;
    const centerY = canvasSize.height - 90;
    const dirX = mouseX - centerX;
    const dirY = mouseY - centerY;
    if (dirY > -10) return;
    const length = Math.hypot(dirX, dirY);
    const dx = (dirX / length) * 10;
    const dy = (dirY / length) * 10;
    setShooting({ x: centerX, y: centerY, dx, dy, color: nextColor });
  };

  const handleRestart = () => {
    setStepCount(0);
    setTimeLeft(60);
    setPaused(false);
    setGameResult("");
    setFinalScore(0);
    setScore(0);
    setShooting(null);
    setShowIntro(true);
    setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-blue-200">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleShoot}
        className="block"
      />
      <img
        ref={shooterImg}
        src="/game2/shooter_boba.png"
        alt="shooter"
        style={{ display: "none" }}
        onLoad={() => {
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx) renderScene(ctx);
        }}
      />
      {!showIntro && (
        <div className="absolute top-4 left-4 px-4 py-2 bg-white/80 text-black rounded-xl shadow-md text-base font-bold">
          Score: {score} ｜ Time: {timeLeft}s
        </div>
      )}
      {!showIntro && (
        <button
          className="absolute bottom-4 right-4 px-5 py-2 bg-amber-600 hover:bg-amber-700 transition text-white rounded-xl shadow-md text-base font-semibold"
          onClick={() => setPaused((prev) => !prev)}
        >
          {paused ? "繼續" : "暫停"}
        </button>
      )}
      {showIntro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-sky-100/80 text-black p-10 rounded-xl shadow-2xl border border-white">
          <h1 className="text-4xl font-bold mb-6 text-indigo-800 drop-shadow-sm">🎯 遊戲說明</h1>
          <ul className="text-lg mb-6 list-disc list-inside space-y-2 text-gray-800">
            <li>使用左右鍵移動珍奶寶寶，點擊畫面發射珍珠</li>
            <li>三顆以上相同顏色的珍珠相連即可消除</li>
            <li>珍珠碰到底部時，遊戲將會結束</li>
            <li>請在 60 秒內盡量消除更多珍珠以取得高分</li>
          </ul>
          <h2 className="text-2xl font-semibold text-indigo-700 mb-2">📈 計分方式</h2>
          <p className="text-lg text-center text-gray-700 mb-8">
            成功消除 <span className="text-green-600 font-bold">3</span> 顆泡泡得 <span className="text-green-600 font-bold">10</span> 分<br />
            每多消除 <span className="text-green-600 font-bold">1</span> 顆額外加 <span className="text-green-600 font-bold">2</span> 分
          </p>
          <button
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xl rounded-xl shadow-lg transition-transform hover:scale-105"
            onClick={() => setShowIntro(false)}
          >
            開始遊戲
          </button>
        </div>
      )}
      {comboText && (
        <div className="absolute inset-0 flex items-center justify-center text-5xl text-red-500 font-extrabold animate-bounce drop-shadow-lg">
          {comboText}
        </div>
      )}
      {gameResult && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-4xl font-bold">
          {gameResult}
          <div className="text-2xl mt-4">得分：{finalScore}</div>
          {gameResult === "Time's Up" && (
            <button
              className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xl rounded-xl shadow-md"
              onClick={handleFinish}
            >
              完成遊戲
            </button>
          )}
          <button
            className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-xl rounded-xl shadow-md"
            onClick={() => window.location.reload()}
          >
            再玩一次
          </button>
        </div>
      )}
    </div>
  );
}
