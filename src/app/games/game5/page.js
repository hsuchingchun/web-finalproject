"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const ReactP5Wrapper = dynamic(
  () => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
);

const sketch = (p, handleFinish, audioRef) => {
  let bgImg, instructImg, continueImg, shootPromptImg, exitImg, replayImg;
  const countdownImgs = [],
    scoreboardImgs = [],
    roundImgs = [];
  let ropeTargetImg, bulletImg, playerStandImg, playerShootImg;
  let successImg, failureImg;

  let state = "instructions";
  let countdownStart = 0;
  const totalRounds = 5;
  let roundNumber = 1;
  let score = 0;
  let hasShot = false;
  let bulletActive = false;
  let bulletX = 0;

  const speeds = [1, 2, 2.5, 3, 3.5];
  let targetX = 0,
    targetDir = 1,
    targetBaseY = 0,
    targetY = 0,
    targetAngle = 0;
  const waveAmplitude = 240;

  let playerX = 0,
    playerY = 0;

  let scaleX = 1;
  let scaleY = 1;

  const urls = {
    bg: "https://i.imgur.com/wERjc7P.jpeg",
    instruct: "https://i.imgur.com/v0PuJjt.png",
    countdown: [
      "https://i.imgur.com/uwwBfUD.png",
      "https://i.imgur.com/4zwJ44y.png",
      "https://i.imgur.com/mfckRBh.png",
    ],
    continue: "https://i.imgur.com/E1ebsRx.png",
    shootPrompt: "https://i.imgur.com/O3GZLd1.png",
    exit: "https://i.imgur.com/JheweWO.png",
    replay: "https://i.imgur.com/YDEvwPh.png",
    scoreboard: [
      "https://i.imgur.com/Wh8MDkc.png",
      "https://i.imgur.com/2yJEYr4.png",
      "https://i.imgur.com/tYU3lVO.png",
      "https://i.imgur.com/DnfnD98.png",
      "https://i.imgur.com/7ip8eYf.png",
      "https://i.imgur.com/esXdokh.png",
    ],
    rounds: [
      "https://i.imgur.com/aDkR0Cy.png",
      "https://i.imgur.com/HDN4YOU.png",
      "https://i.imgur.com/aIgklf1.png",
      "https://i.imgur.com/0OueMg6.png",
      "https://i.imgur.com/xJkpm5z.png",
    ],
    ropeTarget: "https://i.imgur.com/goq78Bu.png",
    bullet: "https://i.imgur.com/JQhWR25.png",
    playerStand: "https://i.imgur.com/gNp1vHC.png",
    playerShoot: "https://i.imgur.com/FVQqOFF.png",
    success: "https://i.imgur.com/m4UHPCC.png",
    failure: "https://i.imgur.com/28OqEd1.png",
  };

  p.preload = () => {
    bgImg = p.loadImage(urls.bg);
    instructImg = p.loadImage(urls.instruct);
    continueImg = p.loadImage(urls.continue);
    shootPromptImg = p.loadImage(urls.shootPrompt);
    exitImg = p.loadImage(urls.exit);
    replayImg = p.loadImage(urls.replay);
    urls.countdown.forEach((u) => countdownImgs.push(p.loadImage(u)));
    urls.scoreboard.forEach((u) => scoreboardImgs.push(p.loadImage(u)));
    urls.rounds.forEach((u) => roundImgs.push(p.loadImage(u)));
    ropeTargetImg = p.loadImage(urls.ropeTarget);
    bulletImg = p.loadImage(urls.bullet);
    playerStandImg = p.loadImage(urls.playerStand);
    playerShootImg = p.loadImage(urls.playerShoot);
    successImg = p.loadImage(urls.success);
    failureImg = p.loadImage(urls.failure);
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.imageMode(p.CENTER);
    scaleX = p.width / 1920;
    scaleY = p.height / 1080;
    playerX = 350 * scaleX;
    playerY = 820 * scaleY;
    targetX = p.width * 0.8;
    targetBaseY = 380 * scaleY;
    targetY = targetBaseY;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    scaleX = p.width / 1920;
    scaleY = p.height / 1080;
    playerX = 350 * scaleX;
    playerY = 820 * scaleY;
    targetBaseY = 380 * scaleY;
  };

  p.draw = () => {
    p.background(0);
    p.image(bgImg, p.width / 2, p.height / 2, p.width, p.height);

    if (state === "instructions") {
      p.image(instructImg, p.width / 2, p.height / 2, 1920 * scaleX, 1080 * scaleY);
      p.image(continueImg, 1700 * scaleX, 975 * scaleY, 300 * scaleX, 100 * scaleY);
    } else if (state === "countdown") {
      const idx = p.floor((p.millis() - countdownStart) / 1000);
      if (idx < 3) {
        p.image(countdownImgs[idx], p.width / 2, p.height / 2, p.width, p.height);
      } else {
        state = "round";
        roundNumber = 1;
        score = 0;
        hasShot = false;
        bulletActive = false;
        targetX = p.width * 0.8;
        targetDir = 1;
        targetAngle = 0;
        targetBaseY = 380 * scaleY;
        targetY = targetBaseY;
      }
    } else if (state === "round") {
      const roundImg = roundImgs[roundNumber - 1];
      let labelX = 335 * scaleX;
      let labelY = 420 * scaleY;
      let labelW = 350 * scaleX;
      let labelH = 150 * scaleY;

      if (roundNumber === 5) {
        labelX = 350 * scaleX;
        labelY = 425 * scaleY;
        labelW = 380 * scaleX;
        labelH = 165 * scaleY;
      }

      p.image(roundImg, labelX, labelY, labelW, labelH);
      p.image(scoreboardImgs[score], 335 * scaleX, 560 * scaleY, 360 * scaleX, 180 * scaleY);

      targetX += speeds[roundNumber - 1] * targetDir;
      if (targetX < p.width * 0.65 || targetX > p.width * 0.95) targetDir *= -1;
      targetAngle += speeds[roundNumber - 1] * 0.007;
      targetY = targetBaseY + waveAmplitude * p.sin(targetAngle * 2) * scaleY - 50 * scaleY;
      p.image(ropeTargetImg, targetX, targetY, 250 * scaleX, 1232 * scaleY);

      if (!hasShot) {
        p.image(playerStandImg, playerX, playerY, 250 * scaleX, 350 * scaleY);
        p.image(shootPromptImg, 1000 * scaleX, 975 * scaleY, 450 * scaleX, 150 * scaleY);
      } else {
        p.image(playerShootImg, playerX, playerY, 300 * scaleX, 350 * scaleY);
      }

      if (bulletActive) {
        bulletX += 25 * scaleX;
        const by = playerY;
        p.image(bulletImg, bulletX, by, 60 * scaleX, 60 * scaleY);
        const regionH = 1232 * scaleY * 0.25,
          cx = targetX,
          cy = targetY + (1232 * scaleY) / 2 - regionH / 2;
        const effR = 250 * scaleX * 0.3,
          bR = 60 * scaleX;
        if (p.dist(bulletX, by, cx, cy) <= effR + bR) {
          score++;
          bulletActive = false;
        }
        if (bulletX > p.width + 50) bulletActive = false;
      }

      if (hasShot && !bulletActive) {
        roundNumber++;
        if (roundNumber > totalRounds) state = "result";
        else {
          hasShot = false;
          bulletActive = false;
          targetX = p.width * 0.8;
          targetDir = 1;
          targetAngle = 0;
          targetY = targetBaseY;
        }
      }
    } else if (state === "result") {
      const img = score >= 3 ? successImg : failureImg;
      p.image(img, p.width / 2, p.height / 2, 2304 * scaleX, 1296 * scaleY);
      p.image(exitImg, 650 * scaleX, 900 * scaleY, 480 * scaleX, 150 * scaleY);
      p.image(replayImg, 1270 * scaleX, 900 * scaleY, 480 * scaleX, 150 * scaleY);
    }
  };

  p.keyPressed = () => {
    if (state === "instructions" && ["C", "c"].includes(p.key)) {
      state = "countdown";
      countdownStart = p.millis();
      if (audioRef?.current?.paused) {
        audioRef.current.play().catch(() => {});
      }
    } else if (state === "round" && !hasShot && ["C", "c"].includes(p.key)) {
      hasShot = true;
      bulletActive = true;
      bulletX = playerX + 250 * scaleX * 0.35;
    } else if (state === "result") {
      if (["C", "c"].includes(p.key)) {
        handleFinish(score >= 3);
        p.noLoop();
      } else if (["D", "d"].includes(p.key)) {
        state = "instructions";
        p.loop();
      }
    }
  };
};

export default function ShootingGamePage() {
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));

    audioRef.current = new Audio("https://raw.githubusercontent.com/hsuchingchun/web-finalproject/main/src/app/games/game5/ShootingGame.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.8;
    audioRef.current.play().catch(() => {});

    // 靜音控制
    const btn = document.getElementById("mute-button");
    let isMuted = false;

    const updateIcon = () => {
      if (!btn) return;
      btn.innerHTML = isMuted
      btn.innerHTML = isMuted
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a9 9 0 0 1 0 14.14"/></svg>`;
    };

    btn.onclick = () => {
      isMuted = !isMuted;
      if (audioRef.current) audioRef.current.muted = isMuted;
      updateIcon();
    };

    updateIcon();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (btn) btn.onclick = null;
    };
  }, []);

  const handleFinish = (isSuccess) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (isSuccess) {
      const newStatus = status - 1;
      localStorage.setItem("status", newStatus);
    }
    router.push("/");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000",
      }}
    >
      {/* 返回按鈕 */}
      <button
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          router.push("/");
        }}
        className="fixed top-5 left-5 z-[1000] px-5 py-2 bg-white/60 text-base font-bold cursor-pointer rounded-4xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 7l-5 5l5 5" />
          <path d="M17 7l-5 5l5 5" />
        </svg>
      </button>

      {/* 聲音控制按鈕 */}
      <div
        id="mute-button"
        className="fixed top-5 right-5 z-[1000] px-4 py-2 bg-white/60 text-base font-bold cursor-pointer rounded-4xl"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      ></div>

      <ReactP5Wrapper sketch={(p) => sketch(p, handleFinish, audioRef)} />
    </div>
  );
}
