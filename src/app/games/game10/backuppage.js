"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import hotpot from '../../../../public/game10/hotpot.png';
import chopstick from '../../../../public/game10/chopstick.png';
import heart_red from '../../../../public/game10/heart_red.png';

export default function Game10() {
  const router = useRouter();
  const [status, setStatus] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleFinish = () => {
    const delta = 1;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus);
    router.push("/");
  };

  return (
    <div className="p-8 flex flex-col items-center justify-center">


      <div className="border-15 border-black w-2/5 mx-auto z-0 flex flex-row items-center justify-center">
      <Image src={hotpot} alt="hotpot" className="w-300px h-300px mx-auto"/>
      <Image src={chopstick} alt="chopstick" className="OnClick absolute top-10 left-150 w-70 h-70 object-contain z-10"/>
      </div>

      <div>
        <Image src={heart_red} alt="heart_red" className="w-10 h-10 mx-auto"/>
      </div>
      
      <h1 className="text-xl font-semibold">刷刷鍋遊戲</h1>
      <h3 className="text-sm">幫助主角刷出完美肉片!</h3>
      <button className="mt-4 px-4 py-2 bg-green-300 rounded" onClick={handleFinish}>
        完成遊戲
      </button>
    </div>
  );
}