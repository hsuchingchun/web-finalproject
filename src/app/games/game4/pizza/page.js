'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './style.css';

const meatImg = 'https://i.postimg.cc/nLS1d45C/meat.png';
const veggieImg = 'https://i.postimg.cc/g29yLBWc/Chat-GPT-Image-2025-4-7-07-13-47.png';
const playerImg = 'https://i.postimg.cc/L5HwS6x7/image.png';
const chefImg = 'https://i.postimg.cc/SszcDwCv/image.png';

const MUSIC_START = 2;
const MUSIC_END = 33.8;

export default function PizzaGame() {
  const router = useRouter();
  const gameRef = useRef(null);
  const audioRef = useRef(null);
  const [status, setStatus] = useState(0);
  const [score, setScore] = useState(0);
  const [meatCount, setMeatCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pizzas, setPizzas] = useState([]);
  const [effects, setEffects] = useState([]);
  const [playerX, setPlayerX] = useState(300);
  const [gameOver, setGameOver] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const intervalRefs = useRef({ timer: null, dropper: null });

  // 取得 localStorage status
  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored, 10));
  }, []);

  // 音樂音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.18;
    }
  }, []);

  // 僅播放2~34秒
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      if (audio.currentTime >= MUSIC_END) {
        audio.pause();
      }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // 鍵盤移動
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || showIntro) return;
      if (e.key === 'ArrowLeft') setPlayerX((x) => Math.max(0, x - 20));
      if (e.key === 'ArrowRight') setPlayerX((x) => Math.min(550, x + 20));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, showIntro]);

  // 倒數計時
  useEffect(() => {
    if (gameOver || showIntro) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          setGameOver(true);
          clearInterval(intervalRefs.current.timer);
          clearInterval(intervalRefs.current.dropper);
          // 遊戲結束時不強制停音樂
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    intervalRefs.current.timer = timer;
    return () => clearInterval(timer);
  }, [gameOver, showIntro]);

  // 披薩產生
  useEffect(() => {
    if (gameOver || showIntro) return;
    const dropper = setInterval(() => {
      setPizzas((prev) => {
        if (prev.length >= 4) return prev;
        return [
          ...prev,
          {
            id: Math.random(),
            x: 100 + Math.random() * 550,
            y: 0,
            type: Math.random() < 0.7 ? 'meat' : 'veggie',
          },
        ];
      });
    }, 500);
    intervalRefs.current.dropper = dropper;
    return () => clearInterval(dropper);
  }, [gameOver, showIntro]);

  // 移動披薩與判定得分
  useEffect(() => {
    if (gameOver || showIntro) return;
    const moveInterval = setInterval(() => {
      setPizzas((prev) => prev.map((p) => ({ ...p, y: p.y + 5 })));
      setPizzas((prev) => {
        const newPizzas = [];
        for (let p of prev) {
          const pizzaBottom = p.y + 60;
          const catchHeight = 350;
          const isCatchZone = pizzaBottom >= catchHeight - 10 && pizzaBottom <= catchHeight + 10;
          const inCatchX = p.x > playerX - 20 && p.x < playerX + 100;
          if (isCatchZone && inCatchX) {
            if (p.type === 'meat') {
              setScore((s) => s + 5);
              setMeatCount((c) => c + 1);
              triggerEffect(p.x, p.y, '+5');
            } else {
              setScore((s) => s - 3);
              triggerEffect(p.x, p.y, '-3');
            }
            continue;
          }
          if (pizzaBottom >= 500) {
            if (p.type === 'meat') {
              setScore((s) => s - 5);
              triggerEffect(p.x, 480, '-5');
            }
            continue;
          }
          newPizzas.push(p);
        }
        return newPizzas;
      });
    }, 30);
    return () => clearInterval(moveInterval);
  }, [playerX, gameOver, showIntro]);

  const triggerEffect = (x, y, text) => {
    const id = Math.random();
    setEffects((prev) => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id));
    }, 500);
  };

  // 回首頁
  const handleFinish = () => {
    const delta = 1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  return (
    <div className="game-bg-wrapper">
      {/* 預載音樂 */}
      <audio
        ref={audioRef}
        src="/game4/pizza_music.mp3"
        preload="auto"
        loop
        controls={false}
      />
      {/* 背景裝飾 */}
      <div className="bg-decor">
        <img src={meatImg} alt="meat-pizza-bg1" className="bg-pizza" style={{ left: '0px', top: '-30px', width: '270px', zIndex: 0, transform: 'rotate(-13deg)' }} />
        <img src={veggieImg} alt="veggie-pizza-bg1" className="bg-pizza" style={{ left: '70px', top: '155px', width: '270px', zIndex: 0, transform: 'rotate(6deg)' }} />
        <img src={meatImg} alt="meat-pizza-bg2" className="bg-pizza" style={{ left: '8px', top: '348px', width: '270px', zIndex: 0, transform: 'rotate(-8deg)' }} />
        <img src={veggieImg} alt="veggie-pizza-bg2" className="bg-pizza" style={{ left: '80px', top: '535px', width: '270px', zIndex: 0, transform: 'rotate(14deg)' }} />
        <img src={chefImg} alt="chef-bg" className="bg-chef" style={{ right: '-130px', bottom: '-60px', width: '600px', zIndex: 0 }} />
      </div>
      {/* 遊戲內容 */}
      <div className="game-wrapper">
        <h2 className="game-title">✨🍕 30 秒接披薩挑戰！每一片都要有肉腸！🍕✨</h2>
        <div id="gameContainer" ref={gameRef}>
          <div id="timer" className="pixel">TIME:{timeLeft}</div>
          <div id="score" className="pixel">SCORE:{score}</div>
          <img src={chefImg} className="chef" alt="Chef" />
          <img src={playerImg} className="player" style={{ left: playerX }} alt="Player" />
          {pizzas.map((pizza) => (
            <img key={pizza.id} src={pizza.type === 'meat' ? meatImg : veggieImg} className="pizza" alt={pizza.type} style={{ left: pizza.x, top: pizza.y }} />
          ))}
          {effects.map((effect) => (
            <div key={effect.id} className={`effect ${effect.text.startsWith('+') ? 'plus' : 'minus'}`} style={{ left: effect.x, top: effect.y }}>
              {effect.text}
            </div>
          ))}
          {/* 說明頁浮層 */}
          {showIntro && (
            <div id="introOverlay">
              <h3 className="intro-title">✨ RULES ✨</h3>
              <p className="intro-sub">
                整天待在研究室已經累鼠了...QQ<br />
                我需要逃跑！我需要熱量！我要吃披薩！<br />
                每一片都要有肉腸！素的我不要！<br />
                沒有吃到不寫論文了！！！😠
              </p>
              <hr className="intro-divider" />
              <p className="intro-detail">30 秒內 ⭠、⭢ 移動人物，接住肉腸披薩！</p>
              <p className="intro-detail">肉腸披薩🍕+5 ，青花菜披薩🥦 -3 ，肉腸披薩掉地上💥 -5</p>
              <p className="intro-detail">❗70 分以上才能讓研究生滿足、回去寫論文❗</p>
              <button className="intro-button" onClick={() => {
                setShowIntro(false);
                if (audioRef.current) {
                  audioRef.current.currentTime = MUSIC_START;
                  audioRef.current.play();
                }
              }}>
                開吃囉
              </button>
            </div>
          )}
          {/* 結果頁浮層 */}
          {gameOver && (
            <div id="resultScreen">
              <h3 className="result-title">{score >= 70 ? '✨ SUCCESS ✨' : '💣 FAIL 💣'}</h3>
              <h3>
                <span className="result-num">{score}</span> 分！吃了 <span className="result-num">{meatCount}</span> 片肉腸披薩！
              </h3>
              <p>
                {score >= 70
                  ? '大滿足！回去寫論文！😇 ❤️'
                  : '不寫了！我就延畢！😠 💥'}
              </p>
              <button id="restartBtn" onClick={() => window.location.reload()}>
                再吃一回
              </button>
              <button id="homeBtn" onClick={handleFinish} title="回首頁">
                {/* House icon SVG */}
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#333">
                  <path d="M3 10.75L12 4l9 6.75V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4h-4v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.75z"/>
                </svg>

              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

