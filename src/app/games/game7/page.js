"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Game7() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  
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
  const imageSize = 600;
  const pieceSize = 200;
  
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
    setPiecesInTray(shuffleArray(initialPieces));
  }, []);

  useEffect(() => {
    let timer;
    if (gameStarted && timeLeft > 0 && !isComplete) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true);
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
  };

  const handleFinish = () => {
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
        newBins[binIdx] = data.piece;
        newBins[data.piece.value] = null;
        return newBins;
      });
    }
  };

  const handleDropInTray = (e) => {
    if (!gameStarted || gameOver) return;
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    if (data.source === "board") {
      const pieceWithNewId = {
        ...data.piece,
        id: `${data.piece.id}-${Date.now()}`
      };
      setPiecesInTray(prev => [...prev, pieceWithNewId]);
      setBins(prev => {
        const newBins = [...prev];
        newBins[data.piece.value] = null;
        return newBins;
      });
    }
  };

  useEffect(() => {
    const isPuzzleComplete = bins.every((piece, index) => piece && piece.value === index);
    setIsComplete(isPuzzleComplete);
  }, [bins]);

  if (!isClient) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[#f0e6d2] p-4">
        <h1 className="text-4xl font-bold mb-8 text-[#4a4a4a] font-pixel">滑板game</h1>
        <div className="text-xl text-[#4a4a4a]">Loading</div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-[#f0e6d2] p-4">
      <h1 className="text-2xl font-bold mb-8 text-[#4a4a4a] font-pixel">滑板game 考驗你的手眼協調</h1>
      
      {!gameStarted && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#98fb98] text-[#2e5a2e] rounded-lg border-4 border-[#2e5a2e] font-pixel shadow-lg p-8 transform scale-110">
            <h2 className="text-xl font-bold mb-4">寫論文要眼明手快，請在15秒內完成滑板拼圖！</h2>
            <button 
              className="w-full px-6 py-3 bg-[#2e5a2e] text-white rounded-lg border-2 border-[#1a3a1a] hover:bg-[#1a3a1a] font-pixel transition-transform hover:scale-105"
              onClick={handleStartGame}
            >
              開始遊戲
            </button>
          </div>
        </div>
      )}

      {gameOver && !isComplete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#ff6b6b] text-[#4a1a1a] rounded-lg border-4 border-[#4a1a1a] font-pixel shadow-lg p-8 transform scale-110">
            <h2 className="text-xl font-bold mb-4">失敗！論文真令人堪憂</h2>
            <button 
              className="w-full px-6 py-3 bg-[#4a1a1a] text-white rounded-lg border-2 border-[#2a0a0a] hover:bg-[#2a0a0a] font-pixel transition-transform hover:scale-105"
              onClick={handleStartGame}
            >
              重新開始
            </button>
          </div>
        </div>
      )}
      
      {isComplete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#98fb98] text-[#2e5a2e] rounded-lg border-4 border-[#2e5a2e] font-pixel shadow-lg p-8 transform scale-110">
            <h2 className="text-xl font-bold mb-4">恭喜你完成，真是手眼協調好寶寶</h2>
            <button 
              className="w-full px-6 py-3 bg-[#2e5a2e] text-white rounded-lg border-2 border-[#1a3a1a] hover:bg-[#1a3a1a] font-pixel transition-transform hover:scale-105"
              onClick={handleFinish}
            >
              返回首頁
            </button>
          </div>
        </div>
      )}

      {gameStarted && !gameOver && (
        <div className="absolute top-4 right-4 bg-[#4a4a4a] text-white px-4 py-2 rounded-lg font-pixel">
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