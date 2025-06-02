"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FOOD_TYPES = [
  { name: "meat", img: "/game8images/meat.png" },
  { name: "corn", img: "/game8images/corn.png" },
  { name: "mushroom", img: "/game8images/mushroom.png" },
  { name: "onion", img: "/game8images/onion.png" },
  { name: "bacon", img: "/game8images/bacon.png" },
];
const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 80;
const FOOD_SIZE = 40;
const MAX_SKEWER = 3;
const SKEWER_HEIGHT = 100;
const OVERLAP_OFFSET = 30;
const SKEWER_WIDTH = 8;

export default function SkewerCatchGame() {
  const router = useRouter();
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [foods, setFoods] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [targetCombo, setTargetCombo] = useState([]);
  const [skewer, setSkewer] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState("");

  useEffect(() => {
    generateTarget();
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const dropTimer = setInterval(() => {
      setFoods((prev) =>
        prev.map((f) => ({ ...f, y: f.y + 3 })).filter((f) => f.y < GAME_HEIGHT)
      );
    }, 70);
    return () => clearInterval(dropTimer);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const createTimer = setInterval(() => {
      const newFood = {
        id: Date.now(),
        x: Math.random() * (GAME_WIDTH - FOOD_SIZE),
        y: 0,
        type: FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)],
      };
      setFoods((prev) => [...prev, newFood]);
    }, 1500);
    return () => clearInterval(createTimer);
  }, [gameOver]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") setPlayerX((x) => Math.max(x - 20, 0));
      if (e.key === "ArrowRight") setPlayerX((x) => Math.min(x + 20, GAME_WIDTH - PLAYER_WIDTH));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const skewerTopY = GAME_HEIGHT - SKEWER_HEIGHT;
    const caught = foods.filter(
      (f) =>
        f.y + FOOD_SIZE >= skewerTopY &&
        f.y + FOOD_SIZE <= skewerTopY + 10 &&
        f.x + FOOD_SIZE > playerX + PLAYER_WIDTH / 2 - 15 &&
        f.x < playerX + PLAYER_WIDTH / 2 + 15
    );
    if (caught.length > 0) {
      setFoods((prev) => prev.filter((f) => !caught.includes(f)));
      setSkewer((prev) => {
        const newSkewer = [...prev, ...caught.map((f) => f.type)].slice(0, MAX_SKEWER);
        if (newSkewer.length === MAX_SKEWER) {
          checkSkewer(newSkewer);
        }
        return newSkewer;
      });
    }
  }, [foods, playerX, skewer]);

  const checkSkewer = (items) => {
    const matched = JSON.stringify(items) === JSON.stringify(targetCombo);
    if (matched) {
      setMessage("Perfect 串燒！+3");
      setScore((s) => s + 3);
    } else {
      setMessage("不對味... -1");
      setScore((s) => s - 1);
    }

    setTimeout(() => {
      setSkewer([]);
      setMessage("");
      generateTarget();
    }, 1000);
  };

  useEffect(() => {
    if (score >= 10) {
      setGameOver(true);
      setGameResult("快樂滿意的串燒燒，又有繼續研究的動力了！");
    } else if (score <= -10) {
      setGameOver(true);
      setGameResult("吃得不開心...研究之路遙遙無期");
    }
  }, [score]);

  const generateTarget = () => {
    const combo = Array.from({ length: 3 }, () =>
      FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)]
    );
    setTargetCombo(combo);
  };

  const handleFinish = () => {
    const delta = 1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  const handleRestart = () => {
    setScore(0);
    setSkewer([]);
    setFoods([]);
    setMessage("");
    generateTarget();
    setGameOver(false);
    setGameResult("");
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <h1 className="text-xl font-bold mb-2">🍢 串串燒接食物遊戲</h1>
      <div>請將目標串燒的食物種類，由右至左的順序放入竹籤上。<br/>10 分即成功，-10分即失敗！</div>

      <div className="h-5 text-red-600 font-semibold">{message}</div>

      <div className="relative border bg-white mt-4" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <div className="flex justify-between items-center mb-1 px-2" style={{ width: GAME_WIDTH }}>
          <div className="flex items-center space-x-1">
            <span className="font-semibold"> 目標串燒：</span>
            {targetCombo.map((t, idx) => (
              <div key={idx} className="flex items-center">
                <img src={t.img} alt={t.name} style={{ width: 32, height: 32 }} />
                {idx < targetCombo.length - 1 && <span className="mx-1 text-lg">➡️</span>}
              </div>
            ))}
          </div>
          <div> 分數：<span className="font-bold">{score}</span></div>
        </div>

        {foods.map((f) => (
          <img
            key={f.id}
            src={f.type.img}
            alt={f.type.name}
            className="absolute"
            style={{
              top: f.y,
              left: f.x,
              width: FOOD_SIZE,
              height: FOOD_SIZE,
              zIndex: 30,
            }}
          />
        ))}

        {skewer.map((item, idx) => (
          <img
            key={idx}
            src={item.img}
            alt={item.name}
            className="absolute"
            style={{
              top: GAME_HEIGHT - SKEWER_HEIGHT + 20 - idx * OVERLAP_OFFSET,
              left: playerX + PLAYER_WIDTH / 2 - FOOD_SIZE / 2,
              width: FOOD_SIZE,
              height: FOOD_SIZE,
              zIndex: 40,
            }}
          />
        ))}

        <div
          className="absolute bottom-0 bg-yellow-900 rounded"
          style={{
            width: SKEWER_WIDTH,
            height: SKEWER_HEIGHT,
            left: playerX + PLAYER_WIDTH / 2 - SKEWER_WIDTH / 2,
            zIndex: 10,
          }}
        ></div>

        {gameOver && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-50">
            <div className="text-xl font-semibold mb-4 text-gray-800">{gameResult}</div>
            <div className="flex space-x-4">
              <button onClick={handleFinish} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">回到主頁</button>
              <button onClick={handleRestart} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">再玩一次</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
