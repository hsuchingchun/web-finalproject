"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Game9() {
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

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Game 9 運動遊戲</h1>
      <button className="mt-4 px-4 py-2 bg-red-300 rounded" onClick={handleFinish}>
        完成遊戲
      </button>
    </div>
  );
}