"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Game6() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const [started, setStarted] = useState(false);
  const [cupX, setCupX] = useState(100);
  const [dragStartX, setDragStartX] = useState(null);
  const [arrowVisible, setArrowVisible] = useState(true);
  const [bgOffset, setBgOffset] = useState(0);
  const [distance, setDistance] = useState(0);
  const [displayedDistance, setDisplayedDistance] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxDistance, setMaxDistance] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const audioRef = useRef(null);
  const slideSoundRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleStartGame = () => {
    if (!started) {
      setStarted(true);
      audioRef.current?.play().catch((err) => {
        console.warn("Failed to play music:", err);
      });
    }
  };

  const pushCup = (delta) => {
    if (delta <= 30 || showResult || attempts >= 5) return;

    const pushDistance = delta * 3;
    const newCupX = cupX + pushDistance;
    const centerX = window.innerWidth / 2;

    setArrowVisible(false);
    slideSoundRef.current.currentTime = 0;
    slideSoundRef.current.play().catch(console.warn);

    setTimeout(() => {
      if (newCupX < centerX) {
        setCupX(newCupX);
      } else {
        const overflow = newCupX - centerX;
        setCupX(centerX);
        setBgOffset((prev) => prev + overflow);
      }

      setDistance(pushDistance);
      setMaxDistance((prev) => (pushDistance > prev ? pushDistance : prev));
      setAttempts((prev) => prev + 1);

      setTimeout(() => {
        setShowResult(true);
      }, 500);
    }, 200);
  };

  const handleMouseDown = (e) => {
    if (!started || showResult || attempts >= 5) return;
    setDragStartX(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!started || dragStartX === null || showResult || attempts >= 5) return;
    const delta = e.clientX - dragStartX;
    pushCup(delta);
    setDragStartX(null);
  };

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setDisplayedDistance((prev) => {
        if (prev < distance) {
          return Math.min(prev + Math.ceil((distance - prev) / 10), distance);
        }
        return prev;
      });
    }, 15);
    return () => clearInterval(interval);
  }, [distance, started]);

  const resetTrial = () => {
    setCupX(100);
    setBgOffset(0);
    setDistance(0);
    setDisplayedDistance(0);
    setArrowVisible(true);
    setShowResult(false);
  };

  const handleFinish = () => {
    const delta = 1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  return (
    <div
      className="relative overflow-hidden min-h-screen p-8 text-white select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* 背景容器 */}
      <div
        className="absolute top-0 left-0 h-full transition-transform duration-1000"
        style={{
          width: "400%",
          backgroundImage: "url('/game6/bg.jpg')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          transform: `translateX(-${bgOffset}px)`,
          zIndex: -1,
        }}
      />

      {/* 左上角：酒杯數 */}
      {started && (
        <div className="absolute top-6 left-6 z-10 flex items-center space-x-2">
          <img
            src="/game6/beer.png"
            alt="beer icon"
            className="w-16 h-16 object-contain drop-shadow"
          />
          <span className="text-5xl font-bold">× {5 - attempts}</span>
        </div>
      )}

      {/* 右上角：本次距離動畫 */}
      {started && (
        <div className="absolute top-6 right-6 text-right text-5xl font-bold z-10">
          {Math.floor(displayedDistance * 0.05)} cm
        </div>
      )}

      {/* 點擊開始畫面 */}
      {!started && (
        <div
          className="absolute inset-0 flex items-center justify-center text-3xl font-bold bg-black/50 z-10"
          onClick={handleStartGame}
        >
          點擊任意處開始
        </div>
      )}

      {/* 酒杯圖 + 箭頭提示 */}
      {started && (
        <>
          <div
            className="absolute bottom-[30%] transition-all duration-300 z-10"
            style={{ left: `${cupX}px` }}
          >
            <img
              src="/game6/beer.png"
              alt="beer"
              draggable={false}
              className="w-30 h-48 object-contain drop-shadow-lg"
            />
          </div>

          {arrowVisible && !showResult && (
            <div className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 animate-pulse text-[100px] select-none z-10">
              ➔
            </div>
          )}
        </>
      )}

      {/* 音效 */}
      <audio ref={audioRef} src="/game6/bgm.wav" loop />
      <audio ref={slideSoundRef} src="/game6/slide.mp3" />

      {/* 結果顯示區 */}
      {showResult && (
        <>
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
          <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 text-xl font-bold z-20">
            最遠距離：{Math.floor(maxDistance * 0.05)} cm
          </div>

          {attempts < 5 ? (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
              <button
                className="px-4 py-2 bg-blue-400 rounded"
                onClick={resetTrial}
              >
                再試一次（{attempts}/5）
              </button>
              <button
                className="px-4 py-2 bg-green-400 rounded"
                onClick={handleFinish}
              >
                完成遊戲
              </button>
            </div>
          ) : (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
              <button
                className="px-4 py-2 bg-green-500 rounded"
                onClick={handleFinish}
              >
                完成遊戲
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
