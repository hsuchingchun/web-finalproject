"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const ReactP5Wrapper = dynamic(
  () => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
);

const sketch = (p, handleFinish) => {
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

  const ui = {
    canvas: { w: 1920, h: 1080 },
    instruction: { x: 960, y: 540, w: 1920, h: 1080 },
    countdown: { x: 960, y: 540, w: 1920, h: 1080 },
    roundLabel: [
      { x: 335, y: 420, w: 350, h: 150 },
      { x: 335, y: 420, w: 350, h: 150 },
      { x: 335, y: 420, w: 350, h: 150 },
      { x: 335, y: 420, w: 350, h: 150 },
      { x: 350, y: 425, w: 380, h: 165 },
    ],
    scoreboard: { x: 335, y: 560, w: 360, h: 180 },
    target: { y: 380, w: 250, h: 1232 },
    playerStand: { x: 350, y: 820, w: 250, h: 350 },
    playerShoot: { x: 350, y: 820, w: 300, h: 350 },
    bullet: { w: 60, h: 60 },
    resultPrompt: { x: 960, y: 540, w: 2304, h: 1296 },
    continue: { x: 1700, y: 975, w: 300, h: 100 },
    shootPrompt: { x: 1000, y: 975, w: 450, h: 150 },
    resultBtn: { y: 900, w: 480, h: 150, exitX: 650, replayX: 1270 },
  };

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
    p.createCanvas(ui.canvas.w, ui.canvas.h);
    p.imageMode(p.CENTER);
    playerX = ui.playerStand.x;
    playerY = ui.playerStand.y;
    targetX = p.width * 0.8;
    targetBaseY = ui.target.y;
    targetY = targetBaseY;
  };

  p.draw = () => {
    p.background(0);
    p.image(bgImg, p.width / 2, p.height / 2, p.width, p.height);

    if (state === "instructions") {
      p.image(
        instructImg,
        ui.instruction.x,
        ui.instruction.y,
        ui.instruction.w,
        ui.instruction.h
      );
      p.image(
        continueImg,
        ui.continue.x,
        ui.continue.y,
        ui.continue.w,
        ui.continue.h
      );
    } else if (state === "countdown") {
      const idx = p.floor((p.millis() - countdownStart) / 1000);
      if (idx < 3) {
        p.image(
          countdownImgs[idx],
          ui.countdown.x,
          ui.countdown.y,
          ui.countdown.w,
          ui.countdown.h
        );
      } else {
        state = "round";
        roundNumber = 1;
        score = 0;
        hasShot = false;
        bulletActive = false;
        targetX = p.width * 0.8;
        targetDir = 1;
        targetAngle = 0;
        targetBaseY = ui.target.y;
        targetY = targetBaseY;
      }
    } else if (state === "round") {
      const lbl = ui.roundLabel[roundNumber - 1];
      p.image(roundImgs[roundNumber - 1], lbl.x, lbl.y, lbl.w, lbl.h);
      p.image(
        scoreboardImgs[score],
        ui.scoreboard.x,
        ui.scoreboard.y,
        ui.scoreboard.w,
        ui.scoreboard.h
      );

      targetX += speeds[roundNumber - 1] * targetDir;
      if (targetX < p.width * 0.65 || targetX > p.width * 0.95) targetDir *= -1;
      targetAngle += speeds[roundNumber - 1] * 0.007;
      targetY = targetBaseY + waveAmplitude * p.sin(targetAngle * 2) - 50;
      p.image(ropeTargetImg, targetX, targetY, ui.target.w, ui.target.h);

      if (!hasShot) {
        p.image(
          playerStandImg,
          ui.playerStand.x,
          ui.playerStand.y,
          ui.playerStand.w,
          ui.playerStand.h
        );
        p.image(
          shootPromptImg,
          ui.shootPrompt.x,
          ui.shootPrompt.y,
          ui.shootPrompt.w,
          ui.shootPrompt.h
        );
      } else {
        p.image(
          playerShootImg,
          ui.playerShoot.x,
          ui.playerShoot.y,
          ui.playerShoot.w,
          ui.playerShoot.h
        );
      }

      if (bulletActive) {
        bulletX += 25;
        const by = playerY;
        p.image(bulletImg, bulletX, by, ui.bullet.w, ui.bullet.h);
        const regionH = ui.target.h * 0.25,
          cx = targetX,
          cy = targetY + ui.target.h / 2 - regionH / 2;
        const effR = ui.target.w * 0.3,
          bR = ui.bullet.w;
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
      p.image(
        img,
        ui.resultPrompt.x,
        ui.resultPrompt.y,
        ui.resultPrompt.w,
        ui.resultPrompt.h
      );
      p.image(
        exitImg,
        ui.resultBtn.exitX,
        ui.resultBtn.y,
        ui.resultBtn.w,
        ui.resultBtn.h
      );
      p.image(
        replayImg,
        ui.resultBtn.replayX,
        ui.resultBtn.y,
        ui.resultBtn.w,
        ui.resultBtn.h
      );
    }
  };

  p.keyPressed = () => {
    if (state === "instructions" && ["C", "c"].includes(p.key)) {
      state = "countdown";
      countdownStart = p.millis();
    } else if (state === "round" && !hasShot && ["C", "c"].includes(p.key)) {
      hasShot = true;
      bulletActive = true;
      bulletX = ui.playerStand.x + ui.playerStand.w * 0.35;
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

  useEffect(() => {
    const stored = localStorage.getItem("status");
    if (stored) setStatus(parseInt(stored));
  }, []);

  const handleFinish = (isSuccess) => {
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
      <ReactP5Wrapper sketch={(p) => sketch(p, handleFinish)} />
    </div>
  );
}
