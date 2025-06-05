import Image from "next/image";

export default function GameArea() {
  return (
    <div className="flex justify-center ">
      <Image
        src="/game9/track.png"
        alt="track"
        width={100}
        height={700}
        style={{ height: "100vh", width: "100px" }}
        className="z-0"
      />
      <Image
        src="/game9/scoreArea-1.png"
        alt="score area"
        width={100}
        height={100}
        className="absolute z-10 bottom-30"
      />
    </div>
  );
}
