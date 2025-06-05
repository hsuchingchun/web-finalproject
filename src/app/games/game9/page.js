"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import GameArea from "./components/GameArea";

export default function Game9() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [score, setScore] = useState(0);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setShowIntro(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    // <div className="p-8">
    //   <h1 className="text-xl font-semibold">Game 9 運動遊戲</h1>
    //   <button className="mt-4 px-4 py-2 bg-red-300 rounded" onClick={handleFinish}>
    //     完成遊戲
    //   </button>
    // </div>
    <div className="bg-[url(/game9/background.png)] h-screen flex items-center justify-center">
      {showIntro ? (
        <div className="flex flex-col items-center gap-20">
          <Image
            src="/game9/description.png"
            alt="game rule"
            width={940}
            height={508}
            priority
          />
          <Image
            src="/game9/start.png"
            alt="game start"
            width={310}
            height={100}
            className="animate-bounce"
          />
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <p className="absolute top-10 left-15 text-4xl font-medium">
            {score}
          </p>
          <Image
            src="/game9/dinasour-l.png"
            alt="dinasour left"
            width={185}
            height={230}
            className="absolute left-25"
          />
          {Array.from({ length: 4 }, (_, i) => i + 1).map((num) => (
            <GameArea key={num} />
          ))}
          <Image
            src="/game9/dinasour-r.png"
            alt="dinasour right"
            width={185}
            height={230}
            className="absolute right-25"
          />
        </div>
      )}
    </div>
  );
}
