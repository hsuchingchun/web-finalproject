"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import localFont from 'next/font/local';
import YouTube from 'react-youtube';

const aura = localFont({
  src: '../../../../public/fonts/aura.ttf',
  variable: '--font-aura'
});

export default function Game7() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const playerRef = useRef(null);
  
  // 初始化拼圖塊，每個拼圖塊都有唯一的ID
  const initialPieces = Array.from({ length: 9 }, (_, i) => ({
    id: `piece-${i}`,
    value: i
  }));

  // 隨機圖的順序
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const [piecesInTray, setPiecesInTray] = useState(initialPieces);
  const [bins, setBins] = useState(Array(9).fill(null));
  const [isComplete, setIsComplete] = useState(false);
  
  const imageUrl = "/game7/puzzle.jpg";
  const imageSize = 450;
  const pieceSize = 150;
  
  // YouTube 播放器選項
  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      loop: 1,
      playlist: 'IfkdMZYIsi8'
    },
  };

  // 處理 YouTube 播放器準備就緒
  const onReady = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(50);
    event.target.playVideo();
    setIsMusicPlaying(true);
  };

  // 處理播放器錯誤
  const onError = (error) => {
    console.error('YouTube Player Error:', error);
  };

  // 切換音樂播放狀態
  const toggleMusic = () => {
    if (playerRef.current) {
      if (isMusicPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  // 停止音樂
  const stopMusic = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
      setIsMusicPlaying(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
    setPiecesInTray(shuffleArray(initialPieces));

    // 設置 3 秒的 loading 時間
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(loadingTimer);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted && timeLeft > 0 && !isComplete) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            stopMusic(); // 遊戲失敗時停止音樂
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, isComplete]);

  const handleStartGame = () => {
    setGameStarted(true);
    setTimeLeft(15);
    setGameOver(false);
    setPiecesInTray(shuffleArray(initialPieces));
    setBins(Array(9).fill(null));
    // 重新開始遊戲時播放音樂
    if (playerRef.current) {
      playerRef.current.playVideo();
      setIsMusicPlaying(true);
    }
  };

  const handleFinish = () => {
    stopMusic(); // 遊戲完成時停止音樂
    const delta = -1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  const getBackgroundPosition = (value) => {
    const row = Math.floor(value / 3);
    const col = value % 3;
    return `-${col * pieceSize}px -${row * pieceSize}px`;
  };

  const handleDragStart = (e, source, piece) => {
    if (!gameStarted || gameOver) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ source, piece }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropInBin = (e, binIdx) => {
    if (!gameStarted || gameOver) return;
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    // 如果目標格子已經有拼圖，則不允許放置
    if (bins[binIdx] !== null && data.source === "tray") {
      return;
    }

    if (data.source === "tray") {
      setPiecesInTray(prev => prev.filter(p => p.id !== data.piece.id));
      setBins(prev => {
        const newBins = [...prev];
        newBins[binIdx] = data.piece;
        return newBins;
      });
    } else if (data.source === "board") {
      setBins(prev => {
        const newBins = [...prev];
        // 找到被拖動的拼圖在九宮格中的位置
        const sourceIdx = newBins.findIndex(p => p && p.id === data.piece.id);
        if (sourceIdx !== -1) {
          // 交換位置
          const temp = newBins[binIdx];
          newBins[binIdx] = data.piece;
          newBins[sourceIdx] = temp;
        }
        return newBins;
      });
    }
  };

  const handleDropInTray = (e) => {
    if (!gameStarted || gameOver) return;
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    if (data.source === "board") {
      // 找到被拖動的拼圖在九宮格中的位置
      setBins(prev => {
        const newBins = [...prev];
        const sourceIdx = newBins.findIndex(p => p && p.id === data.piece.id);
        if (sourceIdx !== -1) {
          newBins[sourceIdx] = null;
        }
        return newBins;
      });
      setPiecesInTray(prev => [...prev, data.piece]);
    }
  };

  useEffect(() => {
    const isPuzzleComplete = bins.every((piece, index) => piece && piece.value === index);
    setIsComplete(isPuzzleComplete);
  }, [bins]);

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#f0e6d2] p-4">
        {/* YouTube 播放器（隱藏） */}
        <div className="hidden">
          <YouTube
            videoId="IfkdMZYIsi8"
            opts={opts}
            onReady={onReady}
            onError={onError}
            iframeClassName="hidden"
          />
        </div>
        <h1 className="text-4xl font-bold mb-8 text-[#4a4a4a] font-['Aura']">滑板拼圖挑戰</h1>
        <div className="text-xl text-[#4a4a4a] font-['Aura'] tracking-wider">Loading...</div>
      </main>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-[#f0e6d2] p-4">
       <button
        onClick={() => router.push("/")}
        className="fixed top-5 left-5 z-[1000] px-5 py-2 bg-white/60 text-base font-bold cursor-pointer rounded-4xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-left "
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 7l-5 5l5 5" />
          <path d="M17 7l-5 5l5 5" />
        </svg>
      </button>
      {/* YouTube 播放器（隱藏） */}
      <div className="hidden">
        <YouTube
          videoId="EdOWFsx_0xc"
          opts={opts}
          onReady={onReady}
          onError={onError}
          iframeClassName="hidden"
        />
      </div>

      {/* 音樂控制按鈕 */}
      <button
        onClick={toggleMusic}
        className="fixed top-4 right-4 bg-[#4a4a4a] text-white p-2 rounded-full hover:bg-[#2a2a2a] transition-colors duration-200 z-50"
        aria-label={isMusicPlaying ? "關閉音樂" : "開啟音樂"}
      >
        {isMusicPlaying ? (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
       </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
        )}
      </button>

      <h1 className="text-2xl font-bold text-[#4a4a4a] font-['Aura'] tracking-wider">考驗你的手眼協調</h1>
      
      {!gameStarted && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#98fb98] text-[#2e5a2e] rounded-lg border-4 border-[#2e5a2e] font-['Aura'] shadow-lg p-8 transform scale-110 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-center tracking-wider">寫論文要眼明手快，手眼協調唷</h2>
            <h2 className="text-xl font-bold mb-4 tracking-wider">請在15秒內完成滑板拼圖！</h2>
            <button 
              className="w-full px-6 py-3 bg-[#2e5a2e] text-white rounded-lg border-2 border-[#1a3a1a] hover:bg-[#1a3a1a] font-['Aura'] transition-transform hover:scale-105"
              onClick={handleStartGame}
            >
              開始遊戲
            </button>
          </div>
        </div>
      )}

      {gameOver && !isComplete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#ff6b6b] text-[#4a1a1a] rounded-lg border-4 border-[#4a1a1a] font-['Aura'] shadow-lg p-8 transform scale-110">
            <h2 className="text-xl font-bold mb-4 tracking-wider">失敗，動作太慢喔！</h2>
            <button 
              className="w-full px-6 py-3 bg-[#4a1a1a] text-white rounded-lg border-2 border-[#2a0a0a] hover:bg-[#2a0a0a] font-['Aura'] transition-transform hover:scale-105"
              onClick={handleStartGame}
            >
              重新開始
            </button>
          </div>
        </div>
      )}
      
      {isComplete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#98fb98] text-[#2e5a2e] rounded-lg border-4 border-[#2e5a2e] font-['Aura'] shadow-lg p-8 transform scale-110">
            <h2 className="text-xl font-bold mb-4 tracking-wider">恭喜你完成，真是手眼協調好寶寶</h2>
            <button 
              className="w-full px-6 py-3 bg-[#2e5a2e] text-white rounded-lg border-2 border-[#1a3a1a] hover:bg-[#1a3a1a] font-['Aura'] transition-transform hover:scale-105"
              onClick={handleFinish}
            >
              返回首頁
            </button>
          </div>
        </div>
      )}

      {gameStarted && !gameOver && (
        <div className="bg-orange-600 text-white px-4 py-2 rounded-lg font-['Aura'] m-5">
          剩餘時間: {timeLeft} 秒
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-12">
        {/* 拼圖區 */}
        <div
          onDrop={handleDropInTray}
          onDragOver={handleDragOver}
          className="grid grid-cols-3 gap-1 p-1 border-4 border-[#8b7355] bg-[#e6d5b8] rounded-lg shadow-lg"
          style={{ 
            width: `${pieceSize * 3 + 32}px`,
            height: `${pieceSize * 3 + 32}px`,
          }}
        >
          {piecesInTray.map((piece) => (
            <div
              key={piece.id}
              draggable={gameStarted && !gameOver}
              onDragStart={(e) => handleDragStart(e, "tray", piece)}
              className={`border-4 border-[#8b7355] rounded-lg transform transition-transform duration-200 shadow-md ${
                gameStarted && !gameOver ? 'cursor-move hover:scale-105' : 'cursor-not-allowed'
              }`}
              style={{
                width: `${pieceSize}px`,
                height: `${pieceSize}px`,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${imageSize}px ${imageSize}px`,
                backgroundPosition: getBackgroundPosition(piece.value),
                backgroundRepeat: "no-repeat",
                backgroundColor: "white",
                imageRendering: "pixelated",
              }}
            ></div>
          ))}
        </div>

        {/* 九宮格 */}
        <div 
          className="grid grid-cols-3 gap-1 bg-[#e6d5b8] p-1 rounded-lg border-4 border-[#8b7355] shadow-lg"
          style={{ 
            width: `${pieceSize * 3 + 32}px`, 
            height: `${pieceSize * 3 + 32}px`,
          }}
        >
          {Array(9)
            .fill(null)
            .map((_, idx) => {
              const piece = bins[idx];
              return (
                <div
                  key={`bin-${idx}`}
                  onDrop={(e) => handleDropInBin(e, idx)}
                  onDragOver={handleDragOver}
                  className="border-4 border-dashed border-brown-500 flex items-center justify-center bg-[#d4c4a8] rounded-lg"
                  style={{ width: `${pieceSize}px`, height: `${pieceSize}px` }}
                >
                  {piece && (
                    <div
                      key={piece.id}
                      draggable={gameStarted && !gameOver}
                      onDragStart={(e) => handleDragStart(e, "board", piece)}
                      className={`w-full h-full rounded-lg shadow-md ${
                        gameStarted && !gameOver ? 'cursor-move' : 'cursor-not-allowed'
                      }`}
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${imageSize}px ${imageSize}px`,
                        backgroundPosition: getBackgroundPosition(piece.value),
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "white",
                        imageRendering: "pixelated",
                      }}
                    ></div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}