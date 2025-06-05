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
  const [status, setStatus] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [paused, setPaused] = useState(false);
  const [comboText, setComboText] = useState(null);
  const [cupX, setCupX] = useState(0);
  const shooterImg = useRef(null);

  const bgImage = useRef(null);

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
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored, 10));
  }, []);

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
    if (paused || !shooting) return;
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
          if (removed.length < updatedBubbles.length) {
            setComboText("Combo!");
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
  }, [shooting, bubbles, paused]);

  useEffect(() => {
    if (stepCount > 0 && stepCount % Math.max(5 - Math.floor(stepCount / 20), 2) === 0) {
      setBubbles(prev => prev.map(b => ({ ...b, y: b.y + 48 })));
    }
  }, [stepCount]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [paused]);

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
    if (paused || shooting) return;
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
    setShooting(null);
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
      <div className="absolute top-4 left-4 px-4 py-2 bg-white/80 text-black rounded-xl shadow-md text-base font-bold">
        Step: {stepCount} ｜ Status: {status} ｜ Score: {stepCount * 10} ｜ Time: {timeLeft}s
      </div>
      <button
        className="absolute bottom-4 right-4 px-5 py-2 bg-amber-600 hover:bg-amber-700 transition text-white rounded-xl shadow-md text-base font-semibold"
        onClick={() => setPaused((prev) => !prev)}
      >
        {paused ? "繼續" : "暫停"}
      </button>
      <button
        className="absolute bottom-20 right-4 px-5 py-2 bg-orange-400 hover:bg-orange-500 transition text-white rounded-xl shadow-md text-base font-semibold"
        onClick={handleRestart}
      >
        重新開始
      </button>
      {comboText && (
        <div className="absolute inset-0 flex items-center justify-center text-5xl text-red-500 font-extrabold animate-bounce drop-shadow-lg">
          {comboText}
        </div>
      )}
      {timeLeft === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-4xl font-bold">
          Game Over
        </div>
      )}
      {bubbles.length === 0 && timeLeft > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-200/80 text-black text-4xl font-bold">
          You Win!
        </div>
      )}
    </div>
  );
}
