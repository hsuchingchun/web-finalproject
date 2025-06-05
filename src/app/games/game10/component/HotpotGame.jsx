"use client"

import { useState, useEffect, useCallback } from "react";
import { Heart, Utensils } from "lucide-react";
import CookingTimingBar from "./CookingTimingBar";
import { useGameState } from "../hooks/useGameState";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useRouter } from "next/navigation";


const HotpotGame = () => {
    const router = useRouter();
    const { hearts, addHeart, removeHeart, resetGame } = useGameState();
    const [gameState, setGameState] = useState("waiting");
    const [meatState, setMeatState] = useState("raw");
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const handleFinish = () => {
        const delta = 1;
        const newStatus = status + delta;
        localStorage.setItem("status", newStatus);
        router.push("/");
    };

    const handleCookingResult = useCallback((result) => {
        setMeatState(result);
        setIsAnimating(true);
        setShowResult(true)

        if (result === "perfect") {
            addHeart();
        } else {
            removeHeart();
        }

        setTimeout(() => {
            setIsAnimating(false);
            setShowResult(false);
            setMeatState("raw");
            setGameState("waiting");
        }, 2000);
    }, [addHeart, removeHeart]);

    const startCooking = () => {
        if (gameState === "waiting") {
            setGameState("cooking");
        }
    };

    useEffect(() => {
        if (hearts >= 3) {
            setGameState("success");
        } else if (hearts <= 0) {
            setGameState("gameOver");
        }
    }, [hearts]);

    const restartGame = () => {
        resetGame();
        setGameState("waiting");
        setMeatState("raw");
        setIsAnimating(false);
        setShowResult(false);
    };

    return (
        <Card className="bg-center z-0 bg-cover bg-[url('/game10/Table.png')] w-96 h-96 relative overflow-hidden bg-gradient-to-b from-amber-100 to-orange-200 border-4 border-amber-800">
            <CardContent className="p-4 h-full flex flex-col">
                {/* Hearts Display */}
                <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3].map((i) => (
                        <Heart
                            key={i}
                            className={`w-8 h-8 ${i <= hearts ? "fill-red-500 text-red-500" : "text-gray-300"
                                }`}
                        />
                    ))}
                </div>

                {/* Game Area */}
                <div className="flex-1 relative">
                    {/* Hotpot */}
                    <div
                        className="bg-center bg-cover bg-[url('/game10/HotPot1.png')] absolute -bottom-20 left-1/2 transform -translate-x-1/2 h-70 w-70"
                    >


                        {/* Steam effect */}

                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-6 bg-gray-300 opacity-60 rounded animate-pulse"></div>
                            <div className="w-2 h-4 bg-gray-300 opacity-40 rounded ml-2 -mt-4 animate-pulse delay-200"></div>
                            <div className="w-2 h-5 bg-gray-300 opacity-50 rounded -ml-4 -mt-3 animate-pulse delay-500"></div>
                        </div>
                    </div>

                    {/* Chopsticks and Meat */}
                    <div
                        className={`absolute right-8 transition-all duration-500 ${isAnimating ? "top-24" : "top-8"
                            }`}
                        onClick={startCooking}
                    >
                        <div className="relative cursor-pointer hover:scale-105 transition-transform">
                            <img src="/game10/chopstick.png" alt="chopstick" className="w-32 h-32" />
                            <div
                                className={`absolute bottom-8 right-20 w-5 h-10 rounded transition-colors duration-300 ${meatState === "raw" ? "bg-red-400" :
                                        meatState === "perfect" ? "bg-amber-600" :
                                            "bg-gray-800"
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Result Display */}
                    {showResult && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center animate-fade-in">
                            <div className={`text-2xl font-bold ${meatState === "perfect" ? "text-green-600" : "text-red-600"
                                }`}>
                                {meatState === "perfect" ? "完美!" : "過熟!"}
                            </div>
                        </div>
                    )}

                    {/* Game Over / Success Overlay */}
                    {(gameState === "success" || gameState === "gameOver") && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                            <div className="text-center text-white">
                                <h2 className="text-2xl font-bold mb-4">
                                    {gameState === "success" ? "🎉 成功!" : "💔 遊戲結束"}
                                </h2>
                                <Button onClick={handleFinish} variant="outline">
                                    完成遊戲
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cooking Timing Bar */}
                {gameState === "cooking" && (
                    <CookingTimingBar onResult={handleCookingResult} />
                )}

                {/* Instructions */}
                {gameState === "waiting" && (
                    <div className="text-center text-sm text-gray-600 mt-2">
                        點擊筷子開始涮肉！
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HotpotGame;
