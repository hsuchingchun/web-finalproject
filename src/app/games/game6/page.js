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
  const [showResult, setShowResult] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);
  const slideSoundRef = useRef(null);
  const breakSoundRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  useEffect(() => {
    const volume = muted ? 0 : 1;
    if (audioRef.current) audioRef.current.volume = volume;
    if (slideSoundRef.current) slideSoundRef.current.volume = volume;
    if (breakSoundRef.current) breakSoundRef.current.volume = volume;
  }, [muted]);

  const handleStartGame = () => {
    if (!started) {
      setStarted(true);
      audioRef.current?.play().catch(console.warn);
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
      if (pushDistance > 3600) {
        setCupX(window.innerWidth + 200);
        setDistance(pushDistance);
        setAttempts((prev) => prev + 1);
        breakSoundRef.current?.play().catch(console.warn);

        setTimeout(() => {
          setIsSuccess(false);
          setShowResult(true);
        }, 500);
        return;
      }

      if (newCupX < centerX) {
        setCupX(newCupX);
      } else {
        const overflow = newCupX - centerX;
        setCupX(centerX);
        setBgOffset((prev) => prev + overflow);
      }

      setDistance(pushDistance);
      setAttempts((prev) => prev + 1);

      setTimeout(() => {
        setIsSuccess(pushDistance >= 2600);
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
        if (prev >= 3600 && distance !== 0) {
          setDistance(0);
          return 0;
        }
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
    setIsSuccess(false);
  };

  const handleFinish = () => {
    localStorage.setItem("status", status + 1);
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
          <img src="/game6/beer.png" alt="beer icon" className="w-16 h-16 object-contain drop-shadow" />
          <span className="text-5xl font-bold">× {5 - attempts}</span>
        </div>
      )}

      {/* 右上角：本次距離 */}
      {started && (
        <div className="absolute top-6 right-6 text-right text-5xl font-bold z-10">
          {Math.floor(displayedDistance * 0.05)} cm
        </div>
      )}

      {/* 靜音按鈕 */}
      <div className="absolute bottom-6 right-6 z-50">
        <button
          className="px-4 py-2 bg-yellow-500 rounded"
          onClick={() => setMuted((prev) => !prev)}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* 點擊開始畫面 */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white z-10 px-6">
          <div className="max-w-xl bg-white/70 p-6 rounded-xl mb-8 text-black text-center">
            <h2 className="text-4xl  text-green-800 font-bold mb-4">Give me a drink, bartender</h2>
            <h3 className="text-2xl font-bold mb-4">遊戲說明</h3>
            <p className="text-xl leading-relaxed">
              鼠標向右滑動將酒杯推出，距離達到目標即可過關。<br />
              成功達到距離目標（130cm 以上）即算挑戰成功！<br />
              有 5 次機會，超過180cm酒杯會掉出桌外，不計分。
            </p>
          </div>
          <div className="flex space-x-8">
            <button
              className="px-6 py-3 text-xl bg-yellow-500 hover:bg-yellow-600 rounded-xl"
              onClick={handleStartGame}
            >
              開始遊戲
            </button>
            <button
              className="px-6 py-3 text-xl bg-gray-500 hover:bg-gray-600 rounded-xl"
              onClick={() => router.push("/")}
            >
              返回首頁
            </button>
          </div>
        </div>
      )}

      {/* 酒杯圖 + 箭頭提示 */}
      {started && (
        <>
          <div
            className="absolute bottom-[30%] transition-all duration-1000 z-10"
            style={{ left: `${cupX}px` }}
          >
            <img src="/game6/beer.png" alt="beer" draggable={false} className="w-30 h-48 object-contain drop-shadow-lg" />
          </div>

          {arrowVisible && !showResult && (
            <div className="absolute bottom-[33%] left-1/2 transform -translate-x-1/2 animate-pulse text-[100px] select-none z-10">
              <img
                src="/game6/arrow.png"
                alt="arrow"
                className="w-24 h-24 object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>
          )}
        </>
      )}

      {/* 音效 */}
      <audio ref={audioRef} src="/game6/bgm.wav" loop />
      <audio ref={slideSoundRef} src="/game6/slide.mp3" />
      <audio ref={breakSoundRef} src="/game6/break.mp3" />

      {/* 結果顯示區 */}
      {showResult && (
        <>
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

          {isSuccess ? (
            <div className="absolute inset-0 z-20">
              <div className="absolute inset-0 flex items-center justify-center text-[100px] font-extrabold text-green-500 z-20 pointer-events-none">
                挑 戰 成 功！
              </div>
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <button className="px-4 py-2 bg-gray-500 rounded" onClick={handleFinish}>
                  完成遊戲
                </button>
              </div>
            </div>
          ) : attempts >= 5 ? (
            <div className="absolute inset-0 z-20">
              <div className="absolute inset-0 flex items-center justify-center text-[100px] font-extrabold text-red-500 z-20 pointer-events-none">
                挑 戰 失 敗！
              </div>
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <button className="px-4 py-2 bg-gray-400 rounded" onClick={() => router.push("/")}>
                  離開遊戲
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
              <button className="px-4 py-2 bg-gray-400 rounded" onClick={resetTrial}>
                再試一次
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
