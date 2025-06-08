"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
      <div className="text-white text-2xl mb-4">載入中...</div>
      <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 animate-[loading_3s_ease-in-out_forwards]"
          style={{ width: "0%" }}
        />
      </div>
      <div className="text-white mt-2">載入遊戲中</div>
    </div>
  );
}
