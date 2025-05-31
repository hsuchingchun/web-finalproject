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
    <main className="p-8">
      <div className="grid grid-cols-3 gap-8 items-start">
        {/* 食物區 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">🏃‍♂️ 運動健康身體好</h2>
          <div className="flex flex-col gap-2">
            {exerciseGames.map((game, i) => (
              <Link
                href={`/games/game${i * 2 + 1}`}
                key={i}
                className="bg-red-200 hover:bg-red-300 p-3 rounded text-center"
              >
                {game.title}
              </Link>
            ))}
          </div>
        </div>

        {/* 角色狀態區 */}
        <div className="flex flex-col items-center">
          {/* <div className="w-32 h-48 bg-gray-400 mb-4 rounded flex items-center justify-center text-white">
            角色
          </div> */}
          <div>
            <img
              src={
                status < 0 ? "/ms1.png" : status > 0 ? "/ms3.png" : "/ms2.png"
              }
              alt="角色圖片"
              style={{ height: "300px" }}
            />
          </div>
          <h1 className="text-xl font-bold mb-2">狀態：{status}</h1>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            🔄 重新開始
          </button>
        </div>

        {/* 運動區 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">🍽️ 美食多吃沒煩惱</h2>
          <div className="flex flex-col gap-2">
            {foodGames.map((game, i) => (
              <Link
                href={`/games/game${(i + 1) * 2}`}
                key={i}
                className="bg-green-200 hover:bg-green-300 p-3 rounded text-center"
              >
                {game.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
