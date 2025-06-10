"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import YouTube from 'react-youtube';

export default function Home() {
  const [status, setStatus] = useState(0);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeGame, setActiveGame] = useState(null);
  const [dismissedGameTitle, setDismissedGameTitle] = useState(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [introPage, setIntroPage] = useState(1);
  const [showChallengeSuccess, setShowChallengeSuccess] = useState(false);
  const [showNoChangeMessage, setShowNoChangeMessage] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const playerRef = useRef(null);

  const gameList = [
    { title: "排球", type: "exercise" },
    { title: "珍奶", type: "food" },
    { title: "桌球", type: "exercise" },
    { title: "披薩", type: "food" },
    { title: "射擊", type: "exercise" },
    { title: "啤酒", type: "food" },
    { title: "滑板", type: "exercise" },
    { title: "串燒", type: "food" },
    { title: "跳舞", type: "exercise" },
    { title: "涮涮鍋", type: "food" },
    { title: "跑酷", type: "exercise" },
    { title: "冰淇淋", type: "food" },
  ];

  const gamePositions = {
    exercise: [
      { x: 250, y: 50 },      // 排球
      { x: 450, y: 50 },    // 桌球
      { x: 100, y: 300 },    // 射擊
      { x: 300, y: 300 },  // 滑板
      { x: 100, y: 600 },    // 跳舞
      { x: 300, y: 600 },  // 跑酷
    ],
    food: [
      { x: 850, y: 35 },    // 珍奶
      { x: 1090, y: 40 },  // 披薩
      { x: 1200, y: 230 },  // 啤酒
      { x: 900, y: 550 },  // 串燒
      { x: 1110, y: 550 },  // 涮涮鍋
      { x: 1100, y: 360 }, // 冰淇淋
    ]
  };

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) {
      setStatus(parseInt(stored));
    } else {
      localStorage.setItem("status", "0");
    }
    setReady(true);

    const handleKeyDown = (e) => {
      if (showIntroMessage) {
        e.preventDefault();
        return;
      }

      // 按下空白鍵，則進入遊戲
      if (activeGame && e.key === ' ') {
        e.preventDefault();
        localStorage.setItem("statusBeforeGame", status.toString());
        localStorage.setItem("justReturnedFromGame", "true");
        window.location.href = activeGame.href;
        return;
      }

      // 按下 Esc 鍵，則取消遊戲
      if (activeGame && e.key === 'Escape') {
        e.preventDefault();
        setActiveGame(null);
        if (activeGame) {
          setDismissedGameTitle(activeGame.title);
        }
        return;
      }

      // 不允許角色移動
      if (activeGame) {
        return;
      }
      // 每次移動的像素數
      const step = 50;
      switch (e.key) {
        case 'ArrowUp':
          setPosition(prev => ({ ...prev, y: Math.max(prev.y - step, -625) }));
          break;
        case 'ArrowDown':
          setPosition(prev => ({ ...prev, y: Math.min(prev.y + step, 200) }));
          break;
        case 'ArrowLeft':
          setPosition(prev => ({ ...prev, x: Math.max(prev.x - step, -775) }));
          break;
        case 'ArrowRight':
          setPosition(prev => ({ ...prev, x: Math.min(prev.x + step, 995) }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntroMessage, introPage, activeGame]);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    const initialStatus = stored ? parseInt(stored) : 0;
    setStatus(initialStatus);
    setPreviousStatus(initialStatus);
    localStorage.setItem("status", initialStatus.toString());

   
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (hasSeenIntro === "true") {
      setShowIntroMessage(false);
    } else {
      setShowIntroMessage(true);
    }

    setReady(true);
  }, []);

  // 角色是否靠近遊戲攤位
  useEffect(() => {
    if (!ready) return; 

    // 角色中心點
    const characterCenterAbsX = window.innerWidth / 2 + position.x;
    const characterCenterAbsY = window.innerHeight * 0.8 + position.y;
    const proximityThreshold = 120; // 接近遊戲

    let currentClosestGame = null;
    let minDistance = Infinity;

    const allGamesData = [];
    const exerciseGames = gameList.filter((g) => g.type === "exercise");
    const foodGames = gameList.filter((g) => g.type === "food");

    exerciseGames.forEach((game, i) => {
      allGamesData.push({
        title: game.title,
        absX: gamePositions.exercise[i].x + 75, 
        absY: gamePositions.exercise[i].y + 75,
        href: `/games/game${i * 2 + 1}`,
      });
    });

    foodGames.forEach((game, i) => {
      allGamesData.push({
        title: game.title,
        absX: gamePositions.food[i].x + 125, 
        absY: gamePositions.food[i].y + 125,
        href: `/games/game${(i + 1) * 2}`,
      });
    });

    // 檢查每個遊戲與角色的距離
    allGamesData.forEach(game => {
      const distance = Math.sqrt(
        (characterCenterAbsX - game.absX) ** 2 +
        (characterCenterAbsY - game.absY) ** 2
      );

      if (distance < proximityThreshold && distance < minDistance) {
        minDistance = distance;
        currentClosestGame = game;
      }
    });

    let gameToDisplay = currentClosestGame; 

    if (currentClosestGame) { 
        if (dismissedGameTitle && currentClosestGame.title === dismissedGameTitle) {
            // 如果這個遊戲曾被取消過，則不顯示彈出框
            gameToDisplay = null;
        } else if (dismissedGameTitle && currentClosestGame.title !== dismissedGameTitle) {
            // 如果靠近了不同的遊戲，則清除被取消的狀態
            setDismissedGameTitle(null);
        }
    } else { 
        setDismissedGameTitle(null);
    }
    if (activeGame?.title !== gameToDisplay?.title) {
      setActiveGame(gameToDisplay);
    }
  }, [position, ready, activeGame, dismissedGameTitle, showIntroMessage, introPage]);

  const handleReset = () => {
    localStorage.setItem("status", "0");
    setStatus(0);
    setPreviousStatus(0);
  };

  if (!ready) return null;

  const foodGames = gameList.filter((g) => g.type === "food");
  const exerciseGames = gameList.filter((g) => g.type === "exercise");

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
      playlist: '-juq36IACEI'
    },
  };

  // YouTube
  const onReady = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(50);
    event.target.playVideo();
    setIsMusicPlaying(true);
  };

  // 播放器錯誤
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

  return (
    <main className="h-screen w-screen bg-cover bg-center bg-no-repeat relative overflow-hidden" style={{ backgroundImage: "url('/mainbg.png')",cursor: "url('/mouse.png') 0 0, auto" }}>
      <div className="hidden">
        <YouTube
          videoId="-juq36IACEI"
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
      
      
      
      <div className="relative">
        {exerciseGames.map((game, i) => (
          <Link
            href={`/games/game${i * 2 + 1}`}
            key={i}
            className="absolute group flex items-center gap-2 z-10"
            style={{
              left: `${gamePositions.exercise[i].x}px`,
              top: `${gamePositions.exercise[i].y}px`
            }}
          >
            <div className="w-[150px] h-[150px] flex items-center justify-center">
              <img
                src={`/game${i * 2 + 1}_entrance.png`}
                alt={game.title}
                className="w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-110 object-contain"
              />
            </div>
          </Link>
        ))}

        {foodGames.map((game, i) => (
          <Link
            href={`/games/game${(i + 1) * 2}`}
            key={i}
            className="absolute group flex items-center gap-2 z-10"
            style={{
              left: `${gamePositions.food[i].x}px`,
              top: `${gamePositions.food[i].y}px`
            }}
          >
            <div className="w-[230px] h-[200px] flex items-center justify-center">
              <img
                src={`/game${(i + 1) * 2}_entrance.png`}
                alt={game.title}
                className="w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-105 object-contain"
              />
            </div>
          </Link>
        ))}
      </div>
      {/* 角色狀態區 */}
      <div 
        className="absolute top-[700px] left-[850px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-transform duration-100 z-[9999] pointer-events-none"
        style={{ 
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        }}
      >
        <div className="pointer-events-none">
          <img
            src={`/role${status}.png`}
            alt="角色圖片"
            style={{ height: "150px" }}
            className="pointer-events-none"
          />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center absolute top-2 left-2 bg-white/90 p-3 rounded-lg shadow-lg z-[9999]">
        <div className="text-xl font-bold">體態：{status}</div>
        <button
          onClick={handleReset}
          className="mt-5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          重新開始
        </button>
        <button
          onClick={() => { setShowIntroMessage(true); setIntroPage(1); }}
          className="mt-5 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          title="顯示遊戲說明"
        >
          遊戲說明
        </button>
      </div>

      {/* 遊戲說明彈出框 */}
      {activeGame && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-70 flex items-center justify-center z-[10000] border-2 ">
          <div className="bg-white w-[300px] p-8 rounded-lg shadow-xl text-center border-2 border-blue-500-100">
            <h2 className="text-2xl font-bold mb-4 tracking-wider">來挑戰{activeGame.title}吧！</h2>
            <p className="text-lg mb-6 tracking-wider">要進入這個遊戲嗎？</p>
            <div className="flex justify-between mt-6">
              {/* 離開按鈕（左） */}
              <button
                onClick={() => {
                  setActiveGame(null);
                  if (activeGame) { 
                    setDismissedGameTitle(activeGame.title);
                  }
                }}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors duration-200 shadow-md font-bold"
              >
                我再看看
              </button>
              {/* 進入遊戲按鈕（右） */}
              <button
                onClick={() => {
                  localStorage.setItem("statusBeforeGame", status.toString());
                  localStorage.setItem("justReturnedFromGame", "true");
                  window.location.href = activeGame.href;
                }}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md font-bold"
              >
                進入遊戲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 介紹訊息彈出框 */}
      {showIntroMessage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10001] p-4">
          <div className="bg-gradient-to-br from-white to-blue-50 w-full max-w-2xl p-12 rounded-xl shadow-2xl text-center border-4 border-blue-600 relative">
            {/* 右上角 X 按鈕 */}
            <button
              className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-red-500 font-bold z-[10002]"
              onClick={() => setShowIntroMessage(false)}
              aria-label="關閉"
              tabIndex={0}
            >
              ×
            </button>
            <h2 className="text-3xl font-extrabold mb-6 text-blue-800 leading-tight">
              菸酒生馬拉松樂園：論文地獄生存戰！
            </h2>
            {introPage === 1 && (
              <p className="text-lg mb-10 text-gray-700 leading-loose text-justify mx-auto max-w-prose">
                轉眼又到了午夜，咖啡杯堆滿桌面，電腦螢幕上閃爍著尚未完稿的詛咒，眼睛……眼睛就要闔上了 ——
                這裡是由論文壓力編織而成的，夢與現實的交錯之地。
                你將扮演一位在學術泥沼中掙扎求生的研究生，
                日夜顛倒、壓力破表，
                得笑著面對教授與同學如催命符般的關心，
                還有那場在心底無止盡延後、遙遙無期的口試……

                這是一場漫長又消耗意志的生存馬拉松，
                而你，得在「健康」與「享樂」之間，做出關鍵選擇！
              </p>
            )}
            {introPage === 2 && (
              <p className="text-justify text-lg mb-10 text-gray-700 leading-loose mx-auto max-w-prose">
                你可以自由探索，點選挑戰「運動型」或「食物型」的關卡，
                將根據你的選擇，塑造專屬的「菸酒生人生曲線」。
                你會成為健身型壯士？圓潤系快樂廢物？
                還是成功找到健康與快樂的完美平衡點呢～？
              </p>
            )}
            {introPage === 3 && (
              <p className="text-justify text-lg mb-10 text-gray-700 leading-loose mx-auto max-w-prose">
                使用鍵盤方向鍵來移動你的角色，靠近各個遊戲攤位。
                當出現提示時，按下空白鍵進入遊戲。
                透過各種運動維持體態與清醒的頭腦，避免在壓力漩渦中爆肝倒地吧！
                （每成功通關一項運動挑戰：體態 -1）享用療癒系美食撫慰被論文摧殘的靈魂，但要小心腰圍爆擊！（每成功通關一項美食挑戰：體態 +1）
              </p>
            )}
            {/* 頁數顯示 */}
            <div className="pt-2 pb-2 text-center text-2xl text-gray-600">({introPage}/3)</div>
            {/* 按鈕區塊 */}
            <div className="flex justify-between mt-4">
              {/* 左側按鈕（第二、三頁才有） */}
              {introPage > 1 ? (
                <div
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold text-lg z-[10002]"
                  onClick={() => setIntroPage(introPage - 1)}
                >
                  上一頁
                </div>
              ) : <div></div>}
              {/* 右側按鈕 */}
              {introPage < 3 ? (
                <div
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg z-[10002]"
                  onClick={() => setIntroPage(introPage + 1)}
                >
                  下一頁
                </div>
              ) : (
                <div
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg z-[10002]"
                  onClick={() => {
                    setShowIntroMessage(false);
                    localStorage.setItem("hasSeenIntro", "true");
                  }}
                >
                  開始遊戲
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
