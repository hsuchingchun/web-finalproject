"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import "./animation.css";
import { Pixelify_Sans } from 'next/font/google';

const pixelify = Pixelify_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Game11() {
  const router = useRouter();
  const [status, setStatus] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleFinish = () => {
    const delta = -1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const playerRef = useRef(null);
  const [obstacles1, setObstacles1] = useState([]);
  const [obstacles2, setObstacles2] = useState([]);
  const [timeLeft, setTimeLeft] = useState(50);
  
  // 重新開始
  const restartGame = () => {
    setGameOver(false);
    setGameWin(false);
    setTimeLeft(50);
    setGameStarted(true);
    setObstacles1([]);
    setObstacles2([]);
    setIsSliding(false);
  };

  // 開始頁面
  useEffect(() => {
    const handleStartKeyDown = (event) => {
      if (event.code === 'Space' && !gameStarted) {
        setGameStarted(true);
      }
    };

    const handleClick = () => {
      if (!gameStarted) {
        setGameStarted(true);
      }
    };

    window.addEventListener('keydown', handleStartKeyDown);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleStartKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameStarted]);
  
  // 遊戲過程
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 按空白鍵或向上鍵跳躍
      if ((event.code === 'Space' || event.code === 'ArrowUp') && !isJumping) {  
        setIsJumping(true);
        setTimeout(() => {
          setIsJumping(false);
        }, 500);
      }

      // 按下鍵盤向下鍵開始滑行
      if (event.code === 'ArrowDown') {
        setIsSliding(true);
      }
    };

    const handleKeyUp = (event) => {
      // 放開向下鍵結束滑行
      if (event.code === 'ArrowDown') {
        setIsSliding(false);
      }
    };

    // 倒計時計時器
    let timer;
    if (gameStarted && !gameOver && !gameWin) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameWin(true);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }

    // 障礙物生成計時器
    let obstacleTimer1;
    let obstacleTimer2;
    if (gameStarted && !gameOver && !gameWin) {
      // 空中障礙物生成延遲
      // obstacleTimer1 = setInterval(() => {
      //   setObstacles1(prev => [...prev, { id: Date.now() }]);
      // }, 1000);

      // 地面障礙物生成延遲
      obstacleTimer2 = setInterval(() => {
        setObstacles2(prev => [...prev, { id: Date.now() + 1 }]);
      }, 1500);
    }

    const isAlive = setInterval(() => {
      if (playerRef.current) {
        const playerBox = playerRef.current.getBoundingClientRect();
        
        // 檢查所有障礙物的碰撞
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obstacle => {
          const obstacleBox = obstacle.getBoundingClientRect();

          const isCollision =
            playerBox.left < obstacleBox.right &&
            playerBox.right > obstacleBox.left &&
            playerBox.top < obstacleBox.bottom &&
            playerBox.bottom > obstacleBox.top;

          if (isCollision) {
            setGameOver(true);
          }

        });
      }
    }, 10);

    if (gameStarted && !gameOver && !gameWin) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(isAlive);
      clearInterval(timer);
      clearInterval(obstacleTimer1);
      clearInterval(obstacleTimer2);
    };
  }, [isJumping, isSliding, gameStarted, gameOver, gameWin]);  

  // game start UI
  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center cursor-pointer">
        <div className={`text-6xl font-bold mt-16 mb-2 text-center text-[#CD4447] ${pixelify.className} z-10`}>PARKOUR</div>
        <div className={`text-2xl font-semibold mb-16 text-center text-gray-400 z-10`}>在準時畢業前越過所有困難吧！</div>
        <div className={`text-xl font-semibold mb-8 text-center text-gray-300 ${pixelify.className} blink-animation z-10`}>
          &#60; Touch or Click to start running &#62;
        </div>
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}></div>
      </div>
    );
  }

  // game over UI
  if (gameOver) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className={`text-4xl font-bold mb-2 text-red-500 ${pixelify.className} z-10`}>Defeat</div>
        <div className={`text-xl font-medium mb-4 text-red-500 ${pixelify.className} z-10`}>再...再跑一次吧...</div>
        <div className={`text-2xl mb-8 text-white ${pixelify.className} z-10`}>
          畢業倒數天數: {timeLeft} 天
        </div>
        <button 
          onClick={restartGame}
          className={`px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xl ${pixelify.className} z-10`}
        >
          重新開始
        </button>
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}></div>
      </div>
    );
  }

  // game win UI
  if (gameWin) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center">
        <div className={`text-4xl font-bold mb-2 text-[#6FBCC4] ${pixelify.className} z-10`}>Victory</div>
        <div className={`text-xl font-medium text-[#6FBCC4] ${pixelify.className} z-10`}> 恭喜你成功畢業！</div>
        <button 
          onClick={restartGame}
          className={`px-8 py-4 bg-white text-[#6FBCC4] rounded-lg hover:bg-[#6FBCC4] hover:text-white transition-colors text-xl mt-8 ${pixelify.className} z-10`}
        >
          再玩一次
        </button>
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}></div>
      </div>
    );
  }

  // 決定要顯示哪張圖片
  const getPlayerImage = () => {
    if (isJumping) return "/game11/girl.png";
    if (isSliding) return "/game11/girlSlide.png";
    return "/game11/girl.png";
  };

  return (
    <>
    <div className="w-full h-screen bg-white relative">
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}></div> 
        <div className={`w-[200px] h-[50px] bg-blue-500 top-10 right-10 absolute text-center text-white pt-3 ${pixelify.className}`}>
          畢業倒數天數: {timeLeft} 天
        </div>

        <div className="w-[1400px] h-[450px] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <Image 
            ref={playerRef}
            src={getPlayerImage()}
            alt="girl" 
            width={100}
            height={100}
            className={`w-[100px] h-auto bottom-[0px] absolute ${isJumping ? 'jump-animation' : ''}`} 
          />

          {obstacles1.map(obstacle => (
            <Image 
              key={obstacle.id}
              src="/game11/pc.jpg"
              alt="pc" 
              width={80}
              height={80}
              className={`w-[80px] h-auto bottom-[90px] left-[1115px] border-2 border-red-500 absolute block-animation obstacle`} 
            />
          ))}
          
          {obstacles2.map(obstacle => (
            <Image 
              key={obstacle.id}
              src="/game11/pc.jpg"
              alt="pc" 
              width={80}
              height={80}
              className={`w-[80px] h-auto bottom-[0px] left-[1115px] absolute block-animation obstacle`} 
            />
          ))}
        </div>
    </div>
    </>
  );
}


  // return (
  //   <div className="p-8">
  //     <h1 className="text-xl font-semibold">Game 11 運動遊戲</h1>
  //     <button className="mt-4 px-4 py-2 bg-red-300 rounded" onClick={handleFinish}>
  //       完成遊戲
  //     </button>
  //   </div>
  // );
