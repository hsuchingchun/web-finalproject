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
  const [obstacles, setObstacles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(200);
  
  const lastTimeRef = useRef(performance.now());
  const lastObstacleTimeRef = useRef(performance.now());
  const obstacleIntervalRef = useRef(getRandomObstacleInterval());

  function getRandomObstacleInterval() {
    return 650 + Math.random() * 1000; // 障礙物生成間隔
  }

  function addObstacle() {
    const obstacleType = Math.floor(Math.random() * 2); // 0: 上方, 1: 下方
    setObstacles(prev => [...prev, {
      id: Date.now(),
      isTop: obstacleType === 0,
      left: 100 // 初始位置在右側
    }]);
  }

  function updateObstaclePosition(deltaTime) {
    setObstacles(prev =>
      prev
        .map(obstacle => ({
          ...obstacle,
          left: obstacle.left - 0.075 * deltaTime // 降低移動速度
        }))
        .filter(obstacle => obstacle.left > -10) // 移出畫面則刪除
    );
  }

  // restart game
  const restartGame = () => {
    setGameOver(false);
    setGameWin(false);
    setTimeLeft(200);
    setGameStarted(true);
    setObstacles([]);
    setIsSliding(false);
    lastTimeRef.current = performance.now();
    lastObstacleTimeRef.current = performance.now();
    obstacleIntervalRef.current = getRandomObstacleInterval();
  };

  // start page
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
      // press spacebar or up to jump
      if ((event.code === 'Space' || event.code === 'ArrowUp') && !isJumping) {  
        setIsJumping(true);
        setTimeout(() => {
          setIsJumping(false);
        }, 700);
      }

      // press down to slide
      if (event.code === 'ArrowDown') {
        setIsSliding(true);
      }
    };

    const handleKeyUp = (event) => {
      // release down key to end slide
      if (event.code === 'ArrowDown') {
        setIsSliding(false);
      }
    };

    // 倒計時
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

    // 障礙物生成
    let animationId;
    const gameLoop = (currentTime) => {
      if (gameStarted && !gameOver && !gameWin) {
        const deltaTime = currentTime - lastTimeRef.current;

        // 生成新障礙物判定
        if (currentTime - lastObstacleTimeRef.current > obstacleIntervalRef.current) {
          addObstacle();
          lastObstacleTimeRef.current = currentTime;
          obstacleIntervalRef.current = getRandomObstacleInterval();
        }

        updateObstaclePosition(deltaTime);
        lastTimeRef.current = currentTime;
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    // 碰撞檢測
    const isAlive = setInterval(() => {
      if (playerRef.current) {
        const playerBox = playerRef.current.getBoundingClientRect();
        
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
      cancelAnimationFrame(animationId);
    };
  }, [isJumping, isSliding, gameStarted, gameOver, gameWin]);  

  // game start UI
  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-white font-semibold flex flex-col items-center justify-center cursor-pointer">
        <div className={`text-m text-center text-gray-300 absolute top-8 left-8 text-left ${pixelify.className} z-10`}>
          ● Press spacebar or up to jump<br/>● Press down to slide
        </div>
        <div 
          onClick={() => router.push("/")}
          className={`text-xl text-center text-[#CD4447] absolute top-8 right-8 text-left ${pixelify.className} z-10 cursor-pointer hover:text-gray-400 transition-colors`}
        >
          Exit
        </div>
        <div className={`text-6xl mt-12 mb-1 text-center text-[#CD4447] ${pixelify.className} z-10`}>PARKOUR</div>
        <div className={`text-2xl mb-12 text-center text-gray-400 tracking-widest z-10`}>在準時畢業前越過所有困難抵達終點吧</div>
        <div className={`text-2xl mb-8 text-center text-gray-300 ${pixelify.className} blink-animation z-10`}>
          &#60; Click or press spacebar to start running &#62;
        </div>
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}>
          <div className='w-full h-full bg-black/30'></div>
        </div>
      </div>
    );
  }

  // game over UI
  if (gameOver) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center tracking-widest">
        <div className={`text-6xl font-bold mb-2 text-[#CD4447] ${pixelify.className} z-10`}>Defeat</div>
        <div className={`text-2xl/10 font-semibold text-gray-400 text-center z-10`}>
          畢業倒數天數: {timeLeft} 天<br/>
          還有時間再跑一次！！！
        </div>
        
        <div className={`flex flex-row gap-8`}>
          <button 
            onClick={restartGame}
            className={`text-gray-100 hover:text-gray-400 transition-colors text-xl mt-8 cursor-pointer ${pixelify.className} z-10`}
          >
            PLAY AGAIN
          </button>
          <button 
            onClick={() => router.push("/")}
            className={`text-[#CD4447] hover:text-gray-400 transition-colors text-xl mt-8 cursor-pointer ${pixelify.className} z-10`}
          >
            EXIT
          </button>
        </div>

        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}>
          <div className='w-full h-full bg-black/30 backdrop-blur-sm'></div>
        </div>
      </div>
    );
  }

  // game win UI
  if (gameWin) {
    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center tracking-widest">
        <div className={`text-6xl font-bold mb-2 text-gray-300 ${pixelify.className} z-10`}>Victory</div>
        <div className={`text-2xl font-semibold text-gray-400 z-10`}> 恭喜你成功準時畢業</div>

        <div className={`flex flex-row gap-8`}>
          <button 
            onClick={restartGame}
            className={`text-gray-100 hover:text-gray-400 transition-colors text-xl mt-8 cursor-pointer ${pixelify.className} z-10`}
          >
            PLAY AGAIN
          </button>
          <button 
            onClick={handleFinish}
            className={`text-[#CD4447] hover:text-gray-400 transition-colors text-xl mt-8 cursor-pointer ${pixelify.className} z-10`}
          >
            EXIT
          </button>
        </div>
        
        <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/game11/bg.gif')",
          backgroundSize: "100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}>
          <div className='w-full h-full bg-black/30 backdrop-blur-sm'></div>
        </div>
      </div>
    );
  }

  // 決定要顯示哪張圖片
  const getPlayerImage = () => {
    if (isJumping) return "/game11/jump.png";
    if (isSliding) return "/game11/slide.png";
    return "/game11/parkour.gif";
  };

  return (
    <>
    <div className="w-full h-screen bg-white relative flex items-start justify-center p-20">
      <div
      className="absolute top-0 left-0 w-full h-full"
      style={{
        backgroundImage: "url('/game11/bg.gif')",
        backgroundSize: "100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}>
        <div className='w-full h-full bg-black/30 backdrop-blur-sm'></div>
      </div> 
      <div className={`font-semibold text-xl text-center tracking-widest text-gray-200 z-10`}>
        畢業倒數天數: {timeLeft} 天
      </div>

      <div className="w-[1250px] h-[450px] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
        <Image 
          ref={playerRef}
          src={getPlayerImage()}
          alt="girl" 
          width={100}
          height={100}
          className={`w-[150px] h-auto bottom-[0px] absolute ${isJumping ? 'jump-animation' : ''}`} 
        />

        {obstacles.map(obstacle => (
          <Image 
            key={obstacle.id}
            src={obstacle.isTop ? "/game11/ufo.png" : "/game11/recycle.png"}
            alt="obstacle" 
            width={80}
            height={80}
            className={`w-[80px] h-auto ${obstacle.isTop ? 'bottom-[138px]' : 'bottom-[0px]'} absolute obstacle`}
            style={{ left: `${obstacle.left}%` }}
          />
        ))}
      </div>
    </div>
    </>
  );
}


