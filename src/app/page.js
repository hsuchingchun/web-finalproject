"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [status, setStatus] = useState(0);
  const [ready, setReady] = useState(false);

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
  }, []);

  const handleReset = () => {
    localStorage.setItem("status", "0");
    setStatus(0);
  };

  if (!ready) return null;

  const foodGames = gameList.filter((g) => g.type === "food");
  const exerciseGames = gameList.filter((g) => g.type === "exercise");

  return (
    <main className="h-screen w-screen bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/mainbg.png')" }}>
      <div className="relative h-screen">
        {exerciseGames.map((game, i) => (
          <Link
            href={`/games/game${i * 2 + 1}`}
            key={i}
            className="absolute group flex items-center gap-2"
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
            className="absolute group flex items-center gap-2"
            style={{
              left: `${gamePositions.food[i].x}px`,
              top: `${gamePositions.food[i].y}px`
            }}
          >
            <div className="w-[250px] h-[250px] flex items-center justify-center">
              <img
                src={`/game${(i + 1) * 2}_entrance.png`}
                alt={game.title}
                className="w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-110 object-contain"
              />
            </div>
          </Link>
        ))}
      </div>
      {/* 角色狀態區 */}
      <div className="absolute top-4/5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div>
          <img
            src={`/role${status}.png`}
            alt="角色圖片"
            style={{ height: "150px" }}
          />
        </div>
      </div>
      <div className="flex justify-center items-center absolute top-2 left-2 bg-white/90 p-3 rounded-lg shadow-lg">
        <div className="text-xl font-bold">體脂：{status}</div>
        <button
          onClick={handleReset}
          className="ml-5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          🔄 重新開始
        </button>
      </div>
    </main>
  );
}
