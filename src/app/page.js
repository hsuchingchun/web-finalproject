"use client"
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState(0);
  const [ready, setReady] = useState(false);

  const gameList = [
    { title: "健身房道具快手", type: "exercise" },
    { title: "早餐選擇挑戰", type: "food" },
    { title: "跳繩大作戰", type: "exercise" },
    { title: "午餐營養配對", type: "food" },
    { title: "健走小冒險", type: "exercise" },
    { title: "下午茶陷阱", type: "food" },
    { title: "瑜珈呼吸節奏", type: "exercise" },
    { title: "宵夜誘惑測驗", type: "food" },
    { title: "跑步接力挑戰", type: "exercise" },
    { title: "飲料熱量知識王", type: "food" },
    { title: "登山者反應力測試", type: "exercise" },
    { title: "甜點分數盤點", type: "food" }
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

  const foodGames = gameList.filter(g => g.type === "food");
  const exerciseGames = gameList.filter(g => g.type === "exercise");

  return (
    <main className="p-8">
      <div className="grid grid-cols-3 gap-8 items-start">
        {/* 食物區 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">🏃‍♂️ 運動遊戲（現在名字都是亂取的）</h2>
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
              src={status < 0 ? "/ms1.png" : status > 0 ? "/ms3.png" : "/ms2.png"}
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
          <h2 className="text-lg font-semibold mb-2">🍽️ 食物遊戲 （現在名字都是亂取的）</h2>
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