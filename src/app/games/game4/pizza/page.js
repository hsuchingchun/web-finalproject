'use client'
import React, { useEffect, useState, useRef } from 'react';
import './style.css';

const meatImg = 'https://i.postimg.cc/nLS1d45C/meat.png';
const veggieImg = 'https://i.postimg.cc/g29yLBWc/Chat-GPT-Image-2025-4-7-07-13-47.png';
const playerImg = 'https://i.postimg.cc/L5HwS6x7/image.png';
const chefImg = 'https://i.postimg.cc/SszcDwCv/image.png';

export default function PizzaGame() {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [meatCount, setMeatCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pizzas, setPizzas] = useState([]);
  const [effects, setEffects] = useState([]);
  const [playerX, setPlayerX] = useState(300);
  const [gameOver, setGameOver] = useState(false);
  const intervalRefs = useRef({ timer: null, dropper: null });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setPlayerX((x) => Math.max(0, x - 20));
      if (e.key === 'ArrowRight') setPlayerX((x) => Math.min(660, x + 20));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          setGameOver(true);
          clearInterval(intervalRefs.current.timer);
          clearInterval(intervalRefs.current.dropper);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    intervalRefs.current.timer = timer;
    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
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
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
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
  }, [playerX, gameOver]);

  const triggerEffect = (x, y, text) => {
    const id = Math.random();
    setEffects((prev) => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id));
    }, 500);
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>✨🍕 30 秒接披薩挑戰！每一片都要有肉腸！🍕✨</h2>
      <div id="gameContainer" ref={gameRef}>
        <div id="timer" className="pixel">TIME:{timeLeft}</div>
        <div id="score" className="pixel">SCORE:{score}</div>
        <img src={chefImg} className="chef" alt="Chef" />
        <img src={playerImg} className="player" style={{ left: playerX }} alt="Player" />
        {pizzas.map((pizza) => (
          <img
            key={pizza.id}
            src={pizza.type === 'meat' ? meatImg : veggieImg}
            className="pizza"
            alt={pizza.type}
            style={{ left: pizza.x, top: pizza.y }}
          />
        ))}
        {effects.map((effect) => (
          <div
            key={effect.id}
            className={`effect ${effect.text.startsWith('+') ? 'plus' : 'minus'}`}
            style={{ left: effect.x, top: effect.y }}>
            {effect.text}
          </div>
        ))}
        {gameOver && (
          <div id="resultScreen">
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
          </div>
        )}
      </div>
    </div>
  );
}







