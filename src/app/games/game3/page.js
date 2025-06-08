"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Script from "next/script";
// window.p5 = p5;
// import "p5/lib/addons/p5.sound";

const ReactP5Wrapper = dynamic(
  () => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
  { ssr: false }
);

// 狀態、計分
let playerY = 0;
let aiY = 0;
let ballX = 0;
let ballY = 0;
let ballSpeedX = 0;
let ballSpeedY = 0;
let playerScore = 0;
let aiScore = 0;
let bounceCountPlayer = 0;
let bounceCountAI = 0;
let serveCount = 0;
const paddleHeight = 120; // 放大球拍高度
const paddleWidth = 120; // 放大球拍寬度
const winningScore = 11;
let gameOver = false;
let winner = null;
let serveTurn = "player";
let serveCountdown = 0;
let awaitingServe = true;
let gameStarted = false;
let isMuted = false;
let hasPlayedEndSound = false;

// 新增：記錄上一幀的位置
let lastPlayerY = 0;
let lastAiY = 0;
let playerVelocity = 0;
let aiVelocity = 0;

// 圖片資源
let backgroundImg;
let tableImg;
let playerImg;
let playerImg2;
let professorImg;
let professorImg2;
let instructionImg;
let successImg;
let loseImg;
let scordBoardImg;
let playerTurnImg;
let professorTurnImg;

// 音效資源
let serveSound;
let playerHitSound;
let professorHitSound;
let loseSound;
let successSound;

//字體
let customFont;

// 狀態變量
let currentPlayerImg;
let currentProfessorImg;
let playerImgSwitchTimer = 0;
let professorImgSwitchTimer = 0;

//ui
const table = { x: 0, y: 0, width: 660, height: 495 }; // 放大球桌尺寸
const tableCollision = { x: 0, y: 0, width: 660, height: 425 }; // 實際碰撞區域

export default function PingpongGame() {
  //主遊戲操控
  const router = useRouter();
  const [status, setStatus] = useState(0);
  const audioRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // 重置遊戲狀態
    gameStarted = false;
    gameOver = false;
    winner = null;
    playerScore = 0;
    aiScore = 0;
    awaitingServe = true;
    serveTurn = "player";
    serveCount = 0;
  }, []);

  const handleFinish = (isWin) => {
    const delta = isWin ? -1 : 0;
    const newStatus = status + delta;
    localStorage.setItem("status", newStatus.toString());
    console.log(delta); //測試
    router.push("/");
  };

  //桌球遊戲變化
  const sketch = (p5) => {
    p5.preload = () => {
      try {
        customFont = p5.loadFont("/fonts/aura.ttf");
        backgroundImg = p5.loadImage("/game3/background1.png");
        tableImg = p5.loadImage("/game3/table2.png");
        playerImg = p5.loadImage("/game3/player1.png");
        playerImg2 = p5.loadImage("/game3/player2.png");
        professorImg = p5.loadImage("/game3/professor1.png");
        professorImg2 = p5.loadImage("/game3/professor2.png");
        instructionImg = p5.loadImage("/game3/instruction.png");
        successImg = p5.loadImage("/game3/game_success.png");
        loseImg = p5.loadImage("/game3/game_lose.png");
        scordBoardImg = p5.loadImage("/game3/score_board.png");
        playerTurnImg = p5.loadImage("/game3/player_turn.png");
        professorTurnImg = p5.loadImage("/game3/professor_turn.png");
        currentPlayerImg = playerImg;
        currentProfessorImg = professorImg;

        if (typeof window.p5?.SoundFile === "function") {
          //   bgm = new window.p5.SoundFile("/game3/game3_bgm.mp3", () => {
          //     // 在音頻加載完成後設置循環播放
          //     if (bgm) {
          //       bgm.setVolume(0.8);
          //       bgm.loop();
          //     }
          //   });
          serveSound = new window.p5.SoundFile("/game3/serve.mp3");
          playerHitSound = new window.p5.SoundFile("/game3/pingpong1-1.mp3");
          professorHitSound = new window.p5.SoundFile("/game3/pingpong2-1.mp3");
          loseSound = new window.p5.SoundFile("/game3/lose.mp3");
          successSound = new window.p5.SoundFile("/game3/success.mp3");
          // 設置音效音量
          if (serveSound) serveSound.setVolume(1);
          if (playerHitSound) playerHitSound.setVolume(1);
          if (professorHitSound) professorHitSound.setVolume(1);
          if (loseSound) loseSound.setVolume(0.5);
          if (successSound) successSound.setVolume(0.5);
        } else {
          console.warn("p5.sound 尚未正確載入");
        }
      } catch (error) {
        console.log("圖片或音效載入失敗：", error);
      }
    };

    p5.windowResized = () => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
      // 重新計算桌子位置
      table.x = (p5.windowWidth - table.width) / 2;
      table.y = (p5.windowHeight - table.height) / 2;
      // 更新碰撞區域位置
      tableCollision.x = table.x;
      tableCollision.y = table.y - 10; // 向上偏移10px
      resetPositions(p5);
    };

    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.textFont(customFont);

      // 重置所有遊戲狀態
      playerScore = 0;
      aiScore = 0;
      gameOver = false;
      winner = null;
      awaitingServe = true;
      serveTurn = "player";
      serveCount = 0;
      isMuted = false;
      hasPlayedEndSound = false;

      // 重置球的位置和速度
      ballX = p5.windowWidth / 2;
      ballY = p5.windowHeight / 2;
      ballSpeedX = 0;
      ballSpeedY = 0;

      // 重置玩家位置
      playerY = p5.windowHeight / 2;

      // 重置教授位置
      aiY = p5.windowHeight / 2;

      // 初始化桌子位置
      table.x = (p5.windowWidth - table.width) / 2;
      table.y = (p5.windowHeight - table.height) / 2;

      // 初始化碰撞區域位置
      tableCollision.x = table.x;
      tableCollision.y = table.y + 10; // 向上偏移10px

      // 重置音效狀態
      // if (serveSound) serveSound.setVolume(1);
      // if (playerHitSound) playerHitSound.setVolume(1);
      // if (professorHitSound) professorHitSound.setVolume(1);
      // if (loseSound) loseSound.setVolume(0.5);
      // if (successSound) successSound.setVolume(0.5);

      resetPositions(p5);
    };

    p5.draw = () => {
      // 繪製背景
      if (backgroundImg) {
        p5.image(backgroundImg, 0, 0, p5.windowWidth, p5.windowHeight);
      } else {
        p5.background(30);
      }

      // 繪製桌子
      if (tableImg) {
        p5.image(tableImg, table.x, table.y, table.width, table.height);
      } else {
        p5.fill(0, 100, 180);
        p5.noStroke();
        p5.rect(table.x, table.y, table.width, table.height);
        p5.stroke(255);
        p5.strokeWeight(2);
        p5.line(
          table.x + table.width / 2,
          table.y,
          table.x + table.width / 2,
          table.y + table.height
        );
      }

      if (gameOver) {
        p5.noStroke();
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, p5.width, p5.height);

        if (winner === "player") {
          p5.image(
            successImg,
            p5.width / 2 - successImg.width / 6,
            p5.height / 2 - successImg.height / 6,
            successImg.width / 3,
            successImg.height / 3
          );
          if (successSound && !successSound.isPlaying()) {
            try {
              successSound.play();
            } catch (error) {
              console.log("成功音效播放失敗：", error);
            }
          }
        } else {
          p5.image(
            loseImg,
            p5.width / 2 - loseImg.width / 6,
            p5.height / 2 - loseImg.height / 6,
            loseImg.width / 3,
            loseImg.height / 3
          );
          if (loseSound && !loseSound.isPlaying()) {
            try {
              loseSound.play();
            } catch (error) {
              console.log("失敗音效播放失敗：", error);
            }
          }
        }
        return;
      }

      if (!gameStarted) {
        p5.noStroke();
        p5.fill(0, 0, 0, 200);
        p5.rect(0, 0, p5.width, p5.height);

        p5.image(
          instructionImg,
          p5.width / 2 - instructionImg.width / 6,
          p5.height / 2 - instructionImg.height / 6,
          instructionImg.width / 3,
          instructionImg.height / 3
        );
        return;
      }

      // 繪製玩家和教授
      const playerPaddleX = table.x - paddleWidth;
      const aiPaddleX = table.x + table.width;
      if (currentPlayerImg) {
        const playerImgX = playerPaddleX - paddleWidth / 2;
        const playerImgY = playerY - paddleHeight / 2;
        p5.image(
          currentPlayerImg,
          playerImgX,
          playerImgY,
          paddleWidth * 2,
          paddleHeight * 2
        );
      } else {
        p5.fill(255);
        p5.noStroke();
        p5.rect(playerPaddleX, playerY, paddleWidth, paddleHeight);
      }

      if (currentProfessorImg) {
        const professorImgX = aiPaddleX - paddleWidth / 2;
        const professorImgY = aiY - paddleHeight / 2;
        p5.image(
          currentProfessorImg,
          professorImgX,
          professorImgY,
          paddleWidth * 2,
          paddleHeight * 2
        );
      } else {
        p5.fill(255);
        p5.noStroke();
        p5.rect(aiPaddleX, aiY, paddleWidth, paddleHeight);
      }

      // 繪製球
      p5.fill(255);
      p5.noStroke();
      p5.ellipse(ballX, ballY, 30, 30);

      if (awaitingServe) {
        // 黑色半透明遮罩
        p5.noStroke();
        p5.fill(0, 0, 0, 100);
        p5.rect(
          p5.width / 2 - p5.width / 6,
          p5.height / 2 - 150,
          p5.width / 3,
          p5.height / 3,
          10,
          10,
          10,
          10
        );

        // 根據 serveTurn 顯示提示圖片
        const img = serveTurn === "player" ? playerTurnImg : professorTurnImg;
        const scale = 1 / 3;
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        const imgX = p5.width / 2 - imgW / 2;
        const imgY = p5.height / 2 - imgH / 2;
        p5.image(img, imgX, imgY, imgW, imgH);

        if (serveTurn === "ai") {
          serveCountdown--;
          if (serveCountdown <= 0) {
            ballX = table.x + table.width - 20;
            ballY = aiY + paddleHeight / 2;
            ballSpeedX = -8;
            ballSpeedY = Math.random(-4, 4);
            awaitingServe = false;
            if (serveSound) {
              try {
                serveSound.play();
              } catch (error) {
                console.log("發球音效播放失敗：", error);
              }
            }
          }
        }
      }

      // 繪製計分板（移到最後，確保顯示在最上層）
      p5.textSize(50);
      p5.textStyle(p5.BOLD);
      p5.fill(0);
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.textAlign(p5.CENTER);
      p5.image(
        scordBoardImg,
        p5.width / 2 - scordBoardImg.width / 12,
        30,
        scordBoardImg.width / 6,
        scordBoardImg.height / 6
      );
      p5.text(
        playerScore,
        p5.width / 2 - scordBoardImg.width / 12 + 68,
        scordBoardImg.height / 12 + 40
      );
      p5.text(
        aiScore,
        p5.width / 2 - scordBoardImg.width / 12 + 218,
        scordBoardImg.height / 12 + 40
      );

      if (playerScore >= winningScore || aiScore >= winningScore) {
        gameOver = true;
        winner = playerScore > aiScore ? "player" : "ai";
        // 停止背景音樂
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }

      if (!awaitingServe) {
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // 檢查球是否在桌面上彈跳
        if (
          ballY + 7 >= tableCollision.y &&
          ballY + 7 <= tableCollision.y + tableCollision.height
        ) {
          if (ballX < table.x + table.width / 2 && bounceCountPlayer < 1) {
            bounceCountPlayer++;
          } else if (ballX >= table.x + table.width / 2 && bounceCountAI < 1) {
            bounceCountAI++;
          }
        }

        // 檢查是否得分
        if (ballX < table.x || ballX > table.x + table.width) {
          // 球出界時，根據球的位置決定得分方
          if (ballX < table.x) {
            // 球從左側出界，AI得分
            aiScore++;
          } else {
            // 球從右側出界，玩家得分
            playerScore++;
          }
          switchServe(p5);
        }

        if (
          ballY < tableCollision.y ||
          ballY > tableCollision.y + tableCollision.height
        ) {
          // 球從上下出界時，根據球的位置決定得分方
          if (ballX < table.x + table.width / 2) {
            // 球在左半場出界，AI得分
            aiScore++;
          } else {
            // 球在右半場出界，玩家得分
            playerScore++;
          }
          switchServe(p5);
        }
      }

      if (p5.keyIsDown(p5.UP_ARROW)) playerY -= 6;
      if (p5.keyIsDown(p5.DOWN_ARROW)) playerY += 6;
      playerY = p5.constrain(
        playerY,
        tableCollision.y - 60,
        tableCollision.y + tableCollision.height - paddleHeight
      );

      // 計算玩家球拍速度
      playerVelocity = playerY - lastPlayerY;
      lastPlayerY = playerY;

      const targetY = ballY - paddleHeight / 2;
      if (ballSpeedX > 0) {
        if (Math.random() < 0.4) aiY += (targetY - aiY) * 0.1;
      } else {
        if (Math.random() < 0.02) {
          aiY +=
            (tableCollision.y +
              tableCollision.height / 2 -
              paddleHeight / 2 -
              aiY) *
            0.1;
        }
      }
      aiY = p5.constrain(
        aiY,
        tableCollision.y - 60,
        tableCollision.y + tableCollision.height - paddleHeight
      );

      // 計算AI球拍速度
      aiVelocity = aiY - lastAiY;
      lastAiY = aiY;

      // 更新圖片切換計時器
      if (playerImgSwitchTimer > 0) {
        playerImgSwitchTimer--;
        if (playerImgSwitchTimer === 0) {
          currentPlayerImg = playerImg;
        }
      }

      if (professorImgSwitchTimer > 0) {
        professorImgSwitchTimer--;
        if (professorImgSwitchTimer === 0) {
          currentProfessorImg = professorImg;
        }
      }

      // 碰撞檢測（使用隱形的碰撞區域）
      if (
        ballX - 7 < playerPaddleX + paddleWidth &&
        ballY > playerY &&
        ballY < playerY + paddleHeight
      ) {
        const relY = playerY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        const baseAngle = norm * (Math.PI / 8);
        const velocityFactor = playerVelocity * 0.1;
        const angle = Math.max(
          Math.min(baseAngle + velocityFactor, Math.PI / 6),
          -Math.PI / 6
        );
        const speed = 12;
        ballSpeedX = speed * Math.cos(angle);
        ballSpeedY = -speed * Math.sin(angle);
        ballX = playerPaddleX + paddleWidth + 7;
        bounceCountPlayer = 0;
        currentPlayerImg = playerImg2;
        playerImgSwitchTimer = 15;
        if (playerHitSound) {
          try {
            playerHitSound.play();
          } catch (error) {
            console.log("擊球音效播放失敗：", error);
          }
        }
      }

      if (ballX + 7 > aiPaddleX && ballY > aiY && ballY < aiY + paddleHeight) {
        const relY = aiY + paddleHeight / 2 - ballY;
        const norm = relY / (paddleHeight / 2);
        const baseAngle = norm * (Math.PI / 6);
        const velocityFactor = aiVelocity * 0.2;
        const angle = Math.max(
          Math.min(baseAngle + velocityFactor, Math.PI / 4),
          -Math.PI / 4
        );
        const speed = 12;
        ballSpeedX = -speed * Math.cos(angle);
        ballSpeedY = -speed * Math.sin(angle);
        ballX = aiPaddleX - 7;
        bounceCountAI = 0;
        currentProfessorImg = professorImg2;
        professorImgSwitchTimer = 15;
        if (professorHitSound) {
          try {
            professorHitSound.play();
          } catch (error) {
            console.log("擊球音效播放失敗：", error);
          }
        }
      }

      if (ballX < table.x || ballX > table.x + table.width) {
        if (ballX < table.x && ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (
          ballX > table.x + table.width &&
          ballX < table.x + table.width / 2
        ) {
          aiScore++;
          switchServe(p5);
        }
      }

      if (ballY > table.y + table.height) {
        if (ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (ballX < table.x + table.width / 2) {
          aiScore++;
          switchServe(p5);
        }
      }

      if (ballY < table.y) {
        if (ballX > table.x + table.width / 2) {
          playerScore++;
          switchServe(p5);
        } else if (ballX < table.x + table.width / 2) {
          aiScore++;
          switchServe(p5);
        }
      }

      ballX = p5.constrain(ballX, -20, p5.width + 20);
    };

    p5.keyPressed = () => {
      if (p5.key === " ") {
        // 第一次按空白鍵時開始播放音樂
        if (!hasInteracted && audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.log("音頻播放失敗：", error);
          });
          setHasInteracted(true);
        }
        if (!gameStarted) {
          gameStarted = true;
          return;
        }
        if (awaitingServe && serveTurn === "player") {
          ballX = table.x + 20;
          ballY = playerY + paddleHeight / 2;
          ballSpeedX = 10;
          ballSpeedY = Math.random() * 6 - 3;
          awaitingServe = false;
          currentPlayerImg = playerImg2;
          playerImgSwitchTimer = 15;
          if (serveSound) {
            try {
              serveSound.play();
            } catch (error) {
              console.log("發球音效播放失敗：", error);
            }
          }
        } else if (!awaitingServe) {
          currentPlayerImg = playerImg2;
          playerImgSwitchTimer = 15;
        }
      }

      if (p5.key === "d" || p5.key === "D") {
        gameOver = false;
        gameStarted = true;
        awaitingServe = true;
        serveTurn = "player";
        serveCount = 0;
        playerScore = 0;
        aiScore = 0;
        resetPositions(p5);
      }

      if (p5.key === "c" || p5.key === "C") {
        if (gameOver) {
          handleFinish(winner === "player");
        }
      }
    };
  };

  return (
    <>
      {/* 確保 p5.sound 能被加入 */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="/game3/p5.sound.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log(
            "p5.sound loaded:",
            typeof window.p5?.SoundFile === "function"
          );
        }}
      />
      {/* audio 僅初始化一次，不重新建立 */}
      <audio
        ref={audioRef}
        src="/game3/game3_bgm.mp3"
        loop
        style={{ display: "none" }}
      />
      <ReactP5Wrapper sketch={sketch} />
      <button
        onClick={() => router.push("/")}
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
          className="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-left "
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11 7l-5 5l5 5" />
          <path d="M17 7l-5 5l5 5" />
        </svg>
      </button>
    </>
  );
}

const resetPositions = (p5) => {
  playerY = table.y + table.height / 2 - paddleHeight / 2;
  aiY = table.y + table.height / 2 - paddleHeight / 2;
  ballX = table.x + table.width / 2;
  ballY = table.y + table.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  bounceCountPlayer = 0;
  bounceCountAI = 0;
  serveCountdown = 0;
};

const switchServe = (p5) => {
  ballX = table.x + table.width / 2;
  ballY = table.y + table.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 0;
  bounceCountPlayer = 0;
  bounceCountAI = 0;
  awaitingServe = true;
  serveCount++;
  if (serveCount >= 2) {
    serveTurn = serveTurn === "player" ? "ai" : "player";
    serveCount = 0;
  }
  if (serveTurn === "ai") serveCountdown = 60;
};
