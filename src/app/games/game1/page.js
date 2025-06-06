"use client"
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Game1() {
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

  const quitGame = () => {
    router.push("/");
  }

  //背景音樂
  const bgmRef = useRef(null);
  const [bgmIsPlaying, setBgmIsPlaying] = useState(true);

  //一開始播放
  const bgmPlay = () => {
    if (bgmRef.current) {
      bgmRef.current.play();
    }
  };

  //音樂開關
  const toggleBgm = () => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    if (bgmIsPlaying) {
      bgm.pause();
    } else {
      bgm.play().catch((err) => {
        console.warn('播放失敗：', err);
      });
    }

    setBgmIsPlaying(!bgmIsPlaying);
  };


  const [gameStage, setGameStage] = useState(0); //遊戲階段 0:主頁 1:方式 2:規則 3:遊戲 4:結果
  const [score, setScore] = useState(0); //儲存得分
  const [success, setSuccess] = useState(false); //運動目標是否達成

  //下一階段
  const nextStage = () => {
    if (gameStage < 4) {
      setGameStage(gameStage + 1);
    }
    if (gameStage == 0) {
      bgmPlay();
    }
  }

  //上一階段
  const prevStage = () => {
    if (gameStage < 4) {
      setGameStage(gameStage - 1);
    }
  }

  //重新開始
  const resetStage = () => {
    window.location.href = "/games/game1";
  }

  // 計時區

  const [prepTime, setPrepTime] = useState(3);      // 準備時間
  const [gameTime, setGameTime] = useState(30);     // 遊戲時間
  const [started, setStarted] = useState(false);    // 是否開始正式遊戲
  const [gameRunning, setGameRunning] = useState(false); // 是否在進行遊戲

  //ready 的計時
  useEffect(() => {
    if (gameStage !== 3) return;

    if (prepTime > -0.5) {
      const prepTimer = setTimeout(() => setPrepTime(prepTime - 1), 1000);
      return () => clearTimeout(prepTimer);
    } else if (!started) {
      setStarted(true);
      setGameRunning(true);
      setSuccess(false);
      newRound(); //新的一輪攻擊
      setLife(3); //生命值補滿
    }
  }, [prepTime, started, gameStage]);


  //遊戲的計時
  useEffect(() => {
    //如果正在遊戲、時間>0，就倒數
    if (gameRunning && gameTime > 0) {
      const gameTimer = setTimeout(() => setGameTime(gameTime - 1), 1000);
      return () => clearTimeout(gameTimer);
    }
    //如果時間到，下一關
    if (gameTime == 0) {
      nextStage();
      setIsJumping(false);
      setIsSpiking(false);
      setPowering(false);
      if (score >= 500) {
        setSuccess(true);
      } else {
        setSuccess(false);
      }
    }
    //如果沒在跑，清除計時器
    if (gameTime === 0 || !gameRunning) {
      clearTimeout(gameTime);
    }
  }, [gameTime, gameRunning]);


  // 生命值

  const [life, setLife] = useState(3); //定義生命值

  useEffect(() => {
    if (gameRunning && life == 0) {
      nextStage();
      setSuccess(false);
    }
  }, [gameRunning, life]);

  // 顯示、隱藏控制

  const [targetOpacity, setTargetOpacity] = useState(0); //紅色目標隱藏與否

  const [showReact, setShowReact] = useState(false); //控制react出現與否、要顯示哪一個react
  const reactions = ["/game1/reactGOOD.png", "/game1/reactOOPS.png"];
  const [selectedReact, setSelectedReact] = useState(0);

  const attackStates = ["/game1/attackState1.png", "/game1/attackState2.png", "/game1/attackState3.png"]; //控制上方要顯示哪一個attack state


  // 新階段，顯示防守球員

  // 設定顯示狀況 0~5
  const [type, setType] = useState(null);

  // 新的攻擊階段
  const newRound = () => {
    setBallPos({ x: 0, y: 0 });//球設為原位

    setAttackState(1); //階段設為1
    setIsJumping(true); //設定為正在跳躍
    setIsSpiking(false); //設定為不在扣球
    setPowerTime(3); //power時間歸零
    setPowerBarOpacity(0); //隱藏powerbar
    setTargetOpacity(0); //隱藏球
    powerCount.current = 0;

    // 根據現在剩餘時間產生防守球員
    if (gameTime >= 15 && gameTime <= 30) {
      const t = Math.floor(Math.random() * 3); // 0, 1, 2
      setType(t); //決定顯示狀況是幾

    } else if (gameTime < 15) {
      const t = 3 + Math.floor(Math.random() * 3); // 3, 4, 5
      setType(t); //決定顯示狀況是幾
    }

  }

  // 決定圖片透明度，index是圖片
  const getOpacity = (index) => {
    if (type === 0) return index === 0 ? 'opacity-100' : 'opacity-0'; //如果選到第0狀況：如果是圖0，顯示
    if (type === 1) return index === 1 ? 'opacity-100' : 'opacity-0'; //如果選到第1狀況：如果是圖1，顯示
    if (type === 2) return index === 2 ? 'opacity-100' : 'opacity-0'; //如果選到第2狀況：如果是圖2，顯示
    if (type === 3) return (index === 0 || index === 1) ? 'opacity-100' : 'opacity-0'; //如果選到第3狀況：如果是圖0和圖1，顯示
    if (type === 4) return (index === 1 || index === 2) ? 'opacity-100' : 'opacity-0'; //如果選到第4狀況：如果是圖1和圖2，顯示
    if (type === 5) return (index === 0 || index === 2) ? 'opacity-100' : 'opacity-0'; //如果選到第5狀況：如果是圖0和圖2，顯示
    return 'opacity-0';
  };




  // 玩家攻擊時的成功與失敗

  //定義攻擊階段
  const [attackState, setAttackState] = useState(1); //1:跳躍 2:攻擊 3:力量

  //第一階段成功
  const jumpSuccess = () => {
    setIsJumping(false); //停止跳躍
    setAttackState(2); //攻擊階段設為2
    setIsSpiking(true); //設定為正在扣球
    setTargetOpacity(100); //球出現
    setScore(score + 10); //+10分
    setShowReact(true); //show react
    setSelectedReact(0); //select GOOD!
    setTimeout(() => {
      setShowReact(false); //一秒後隱藏 react
    }, 1000);
  }

  //第二階段成功
  const spikeSuccess = () => {
    setIsSpiking(false); //停止扣球
    setAttackState(3); //攻擊階段設為3
    setPowering(true); //設定為正在蓄力
    setPowerBarOpacity(100); //powerbar 出現
    setScore(score + 50); //+50分
    setShowReact(true); //show react
    setSelectedReact(0); //select GOOD!
    setTimeout(() => {
      setShowReact(false); //一秒後隱藏 react
    }, 1000);
  }

  //失敗
  const loseLife = () => {
    setLife(nowLife => nowLife - 1); //減一命
    setShowReact(true); //show react
    setSelectedReact(1); //select OOPS!
    setTimeout(() => {
      setShowReact(false); //一秒後隱藏 react
    }, 1000);
  }


  // 玩家操作區：跳躍

  //攻擊手跳躍動畫
  const [isJumping, setIsJumping] = useState(false); //是否正在跳
  const [jumpDuration, setJumpDuration] = useState(0); //跳躍速度調節

  //速度調節
  useEffect(() => {
    if (gameRunning && isJumping) {
      if (gameTime >= 20) {
        setJumpDuration(1.2);
      } else if (gameTime >= 10 && gameTime < 20) {
        setJumpDuration(1);
      } else {
        setJumpDuration(0.8);
      }
    }
  }, [gameTime]);


  //設定跳躍高度
  const jumpRef = useRef(null);
  //設定網子高度
  const netRef = useRef(null);
  //設定球高度
  const ballRef = useRef(null);

  //按下 jump
  const jump = () => {

    if (attackState == 1 && ballRef.current && netRef.current) {

      const ballY = ballRef.current.getBoundingClientRect().top; //抓取跳躍高度
      const netY = netRef.current.getBoundingClientRect().top; //抓取網子高度

      //判斷跳躍高度
      if (ballY < netY) { //如果跳超過網子
        jumpSuccess(); //執行jumpSuccess內容
      } else { //如果沒有超過網子
        newRound(); //新的一輪攻擊
        loseLife(); //損失生命
      }
    }
  }


  // 玩家操作區：扣球落點

  // 球左右跑動畫
  const [isSpiking, setIsSpiking] = useState(false); //是否正在扣球
  const [spikeDuration, setSpikeDuration] = useState(0); //調整球左右跑的速度

  useEffect(() => {
    if (gameRunning && isSpiking) {
      if (gameTime >= 20) {
        setSpikeDuration(2);
      } else if (gameTime >= 10 && gameTime < 20) {
        setSpikeDuration(1.5);
      } else {
        setSpikeDuration(1.2);
      }
    }
  }, [gameTime]);

  //設定球位置
  const targetRef = useRef(null);
  //設定防守球員相對位置
  const receiverRef0 = useRef(null);
  const receiverRef1 = useRef(null);
  const receiverRef2 = useRef(null);

  //按下 spike
  const spike = () => {
    if (attackState == 2 && targetRef.current && (receiverRef0.current || receiverRef1.current || receiverRef2.current)) {
      const targetX = targetRef.current.getBoundingClientRect().left; //抓取球位置
      const receiver0X = receiverRef0.current.getBoundingClientRect().left; //抓取防守球員位置
      const receiver1X = receiverRef1.current.getBoundingClientRect().left; //抓取防守球員位置
      const receiver2X = receiverRef2.current.getBoundingClientRect().left; //抓取防守球員位置

      // 判斷 spike 成功與否
      if (type === 0) {
        if (targetX > receiver0X + 50) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      } else if (type === 1) {
        if (targetX < receiver1X - 25 || targetX > receiver1X + 50) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      } else if (type === 2) {
        if (targetX < receiver2X - 25) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      } else if (type === 3) {
        if (targetX > receiver2X + 50) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      } else if (type === 4) {
        if (targetX < receiver1X - 25) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      } else if (type === 5) {
        if (targetX > receiver0X + 50 && targetX < receiver2X - 25) {
          spikeSuccess(); //執行spikeSucces內容
        } else {
          newRound(); //新的一輪攻擊
          loseLife(); //損失生命
        }
      }

    }
  }


  // 玩家操作區：力量

  // 顯示 power 時間
  const flexPowerTime = "opacity-100";

  // 連擊 power
  const [powering, setPowering] = useState(false);
  const [powerTime, setPowerTime] = useState(3);

  const powerCount = useRef(0);

  //power bar 顯示
  const [powerBarOpacity, setPowerBarOpacity] = useState(0);

  //載入 bar 們
  const PowerBars = ["/game1/powerBar00.png", "/game1/powerBar01.png", "/game1/powerBar02.png",
    "/game1/powerBar03.png", "/game1/powerBar04.png", "/game1/powerBar05.png", "/game1/powerBar06.png",
    "/game1/powerBar07.png", "/game1/powerBar08.png", "/game1/powerBar09.png", "/game1/powerBar10.png"];

  //設定應該顯示的 bar
  const [selectedPowerBar, setSelectedPowerBar] = useState([]);

  //按下 power
  const power = () => {
    if (powering) {
      powerCount.current += 1;
    }
  }

  //倒數 power
  useEffect(() => {
    if (powering && powerTime > 0) {

      //根據 powerCount 選擇應該顯示的bar
      if (powerCount.current <= 10) {
        setSelectedPowerBar(PowerBars[powerCount.current]);
      }
      else {
        setSelectedPowerBar(PowerBars[10]);
      }


      const powerTimer = setTimeout(() => setPowerTime(powerTime - 1), 1000);
      return () => clearTimeout(powerTimer);
    }

    // 如果 power 時間到
    if (powering && powerTime === 0) {
      setTargetOpacity(0);
      powerAndSpike(); //球打下來
      if (powerCount.current <= 5) { // 如果power<=5，減一命後下一round
        setPowering(false);
        loseLife(); //損失生命
        newRound();
      } else if (powerCount.current > 5) { // 如果power>0，直接下一round
        setPowering(false);
        setScore(score + (powerCount.current) * 10); //+power分數

        setShowReact(true); //show react
        setSelectedReact(0); //select GOOD!
        setTimeout(() => {
          setShowReact(false); //一秒後隱藏 react
          newRound();
        }, 1000);
      }
    }

  }, [powerTime, powering]);

  // 扣球路徑
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const powerAndSpike = () => {
    if (!targetRef.current || !containerRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();


    const newX = targetRect.left - containerRect.left;
    const newY = targetRect.top - containerRect.top;

    setBallPos({ x: newX, y: newY - 14 });

  }



  // 按空白鍵的判斷

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault(); // 防止捲動畫面等預設行為
        //jump
        jump();
        //spike
        spike();
        //power
        power();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 移除監聽器以避免記憶體洩漏
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attackState]);


  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#EEE8E1]
            bg-[url('/game1/indexBg.png')] bg-no-repeat bg-cover bg-center">

      {/* bgm */}
      <audio ref={bgmRef} src="/game1/bgm.mp3" />

      {/* bgm 開關 */}
      <img src={`${bgmIsPlaying ? "/game1/soundon.png" : "/game1/soundmuted.png"}`}
        className={`w-[30px] cursor-pointer z-100 absolute top-4 left-4 ${gameStage > 0 ? "flex" : "hidden"}`}
        onClick={toggleBgm} />

      {/* 主頁 */}
      <div className={`${gameStage == 0 ? "flex" : "hidden"} flex-col items-center justify-center w-full h-full`}>
        <img src="/game1/gameName.png" alt="" className="w-[400px] mb-20" />
        <img src="/game1/description.png" alt="" className="w-[400px] mb-16" />
        <img src="/game1/enterBtn.png" alt="" className="w-[100px] cursor-pointer mt-6
                hover:translate-y-0.5 transition-all" onClick={nextStage} />
        <img src="/game1/quitBtn.png" alt="" className="w-[100px] cursor-pointer mt-6
                hover:translate-y-0.5 transition-all" onClick={quitGame} />
      </div>


      {/* 規則頁 */}
      <div className={`${gameStage == 1 || gameStage == 2 ? "flex" : "hidden"} flex-col items-center justify-center w-full h-full`}>
        <div className="bg-[url('/game1/ruleBg.png')] bg-no-repeat bg-contain bg-center
                w-[1200px] h-[700px] flex flex-col justify-top items-center p-14">
          <img src="/game1/rule.png" alt="" className="w-[240px] mb-22" />
          <img src={`${gameStage == 1 ? "/game1/ruleAttack.png" : "/game1/ruleLife.png"}`} alt="" className="h-[260px] w-auto mb-26" />
          <div className="flex justify-center items-center gap-10">
            <img src="/game1/prevBtn.png" alt="" className="w-[100px] cursor-pointer hover:translate-y-0.5 transition-all" onClick={prevStage} />
            <img src={`${gameStage == 1 ? "/game1/nextBtn.png" : "/game1/startBtn.png"}`} alt="" className="w-[100px] cursor-pointer hover:translate-y-0.5 transition-all" onClick={nextStage} />
          </div>
        </div>
      </div>


      {/* 遊玩頁 */}
      <div className={`${gameStage == 3 ? "flex" : "hidden"} flex flex-col w-full h-full justify-center items-center`}>

        {/* pixel 字體 */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@200;400;700&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />

        {/* 動畫們 */}
        <style jsx>{`@keyframes jump { 0%, 100% { transform: translateY(0px); }
                                                    50% { transform: translateY(-100px); } }

                             @keyframes spike { 0%, 100% { transform: translateX(0px); }
                                                     50% { transform: translateX(390px); } }
                             
                             @keyframes playReaction { 0%, 100% { opacity: 0; transform: translateY(10px); }
                                                            50% { opacity: 1; transform: translateY(0px); } } `}</style>


        {/* 一開始的倒數 */}
        {!started ?
          (
            <div className="w-screen h-screen flex justify-center items-center absolute z-100 bg-[#eee8e1b6]">

              <div className="text-[100px] text-[#d57e2e]" style={{ fontFamily: 'Silkscreen, sans-serif' }}>
                {prepTime === 0 ? 'Start!' : prepTime}
              </div>
            </div >
          ) :
          <></>}


        {/* 上方列 */}
        < div className="w-full h-[10vh] flex justify-center items-end" >
          <div className="w-[60%] flex justify-between items-center py-2">

            {/* time */}
            <div className="flex justify-center items-center gap-4">
              <img src="/game1/timeIcon.png" alt="" className="w-[24px]" />
              <div className="text-2xl text-[#504a50]" style={{ fontFamily: 'Silkscreen, sans-serif' }}>
                {gameTime >= 10 ? gameTime : "0" + gameTime}
              </div>
            </div>
            {/* score */}
            <div className="text-2xl text-[#504a50]" style={{ fontFamily: 'Silkscreen, sans-serif' }}>score: {score}</div>

            {/* life */}
            <div className="flex justify-center items-center">
              {life == 3 && <img src="/game1/life3.png" alt="" className="w-[90px]" />}
              {life == 2 && <img src="/game1/life2.png" alt="" className="w-[90px]" />}
              {life == 1 && <img src="/game1/life1.png" alt="" className="w-[90px]" />}
            </div>
          </div>
        </div>

        {/* 中間遊戲區 */}
        < div className="w-[60%] h-[75vh] mt-4 mb-8 bg-[#76BFC8] flex flex-col justify-start items-center relative" >

          {/* react */}
          <div className="flex absolute top-2 right-2 z-10">
            <img src={`${reactions[selectedReact]}`} alt="" className={`h-[40px] w-auto ${showReact ? "flex" : "hidden"}`}
              style={{
                animationName: 'playReaction',
                animationDuration: `1s`,
                animationTimingFunction: 'ease-in-out',
              }} />
          </div>

          {/* state */}
          <div>
            <img src={attackStates[attackState - 1]} className="w-[280px] my-[20px]" />
          </div>

          {/* 場地內 */}
          <div className="w-[640px] h-[480px] bg-[url('/game1/court.png')] bg-no-repeat bg-contain bg-center relative">

            <img src="/game1/net.png" className="absolute w-[580px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-34" ref={netRef} />

            {/* 防守球員區 */}
            <div className="w-full h-[10%] flex justify-center items-end translate-y-[24px]">
              <div className="flex w-[60%] justify-between">
                <img src="/game1/receiver.png" ref={receiverRef0}
                  className={`w-[50px] transition-all duration-[0.5s] ${getOpacity(0)}`} />  {/* 第0張圖 */}
                <img src="/game1/receiver.png" ref={receiverRef1}
                  className={`w-[50px] transition-all duration-[0.5s] ${getOpacity(1)}`} />  {/* 第1張圖 */}
                <img src="/game1/receiver.png" ref={receiverRef2}
                  className={`w-[50px] transition-all duration-[0.5s] ${getOpacity(2)}`} />  {/* 第2張圖 */}
              </div>
            </div>

            {/* 攻擊球員區 */}
            <div className="w-full h-[34%] flex justify-center items-start">
              <div className="flex flex-col w-[66%] relative" ref={containerRef}>

                {/* 目標 */}
                <img src="/game1/target.png" alt="" className={`w-[28px] h-[28px] opacity-${targetOpacity} absolute`}
                  ref={targetRef}
                  style={{
                    animationName: 'spike',
                    animationDuration: `${spikeDuration}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationPlayState: isSpiking ? 'running' : 'paused'
                  }} />

                {/* 球 */}
                <img src="/game1/volleyball.png" ref={ballRef} alt="" className="w-[22px] h-[22px] z-10 translate-y-[120px] absolute transition-all duration-200"
                  style={{
                    animationName: 'jump',
                    animationDuration: `${jumpDuration}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationPlayState: isJumping ? 'running' : 'paused',


                    left: ballPos.x, top: ballPos.y
                  }} />

                {/* 球員 */}
                <img src="/game1/player.png" ref={jumpRef} alt="" className="w-[60px] z-10 translate-y-[120px]"
                  style={{
                    animationName: 'jump',
                    animationDuration: `${jumpDuration}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationPlayState: isJumping ? 'running' : 'paused'
                  }}
                />



              </div>

              {/* 舉球員
        <div className="flex w-[10%] translate-y-[80px]">
            <img src="/game1/set.png" alt="" className="w-[40px]" />
        </div> */}

            </div>

            {/* power bar */}
            <div className={`w-full h-[44%] flex flex-col justify-center items-center opacity-${powerBarOpacity}`}>
              <div className="text-white px-2 w-[80%]" style={{ fontFamily: 'Silkscreen, sans-serif' }}>power</div>
              <img src={selectedPowerBar} alt="" className="w-[80%]" />
            </div>
          </div>

        </div >

        {/* space */}
        <div className="w-full h-[15vh] flex flex-col items-center">
          <img src={`${attackState == 3 ? "/game1/spaceRapidly.png" : "/game1/spaceOnce.png"}`} alt="space" className="w-[300px]" />
          <div className={`w-[300px] opacity-0 text-[#CD4447] flex justify-end ${attackState == 3 ? flexPowerTime : ""}`}
            style={{ fontFamily: 'Silkscreen, sans-serif' }}>
            in {powerTime} sec
          </div>
        </div>
      </div>


      {/* 結果頁 */}
      <div className={`${gameStage == 4 ? "flex" : "hidden"} flex-col items-center justify-center w-full h-full gap-16`}>

        <img src="/game1/gameName.png" alt="" className="w-[400px]" />

        <div className="flex flex-col items-center">
          <img src="/game1/resultScore.png" alt="" className="w-[120px]" />
          <div className="text-[#504a50] text-6xl" style={{ fontFamily: 'Silkscreen, sans-serif' }}>{score}</div>
        </div>

        <img src={`${success ? "/game1/resultSuccess.png" : "/game1/resultFail.png"}`} alt="" className="w-[400px]" />

        <div>
          <img src={`${success ? "/game1/finishBtn.png" : "/game1/restartBtn.png"}`} alt="" className="w-[100px] cursor-pointer mt-6 hover:translate-y-0.5 transition-all"
            onClick={success ? handleFinish : resetStage} />

          <img src={`${success ? "/game1/restartBtn.png" : "/game1/quitBtn.png"}`} alt="" className="w-[100px] cursor-pointer mt-6 hover:translate-y-0.5 transition-all"
            onClick={success ? resetStage : quitGame} />
        </div>
      </div>



    </div>


    // </div>
  );
}