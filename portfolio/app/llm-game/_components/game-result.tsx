"use client";

interface GameResultProps {
  keyword: string;
  guess: string;
  isWin: boolean;
  onPlayAgain: () => void;
}

export default function GameResult({
  keyword,
  guess,
  isWin,
  onPlayAgain,
}: GameResultProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className={`text-5xl font-bold ${isWin ? "text-green-500" : "text-red-500"}`}
      >
        {isWin ? "You Win!" : "You Lose!"}
      </div>
      <div className="flex flex-col gap-1 text-lg text-zinc-600 dark:text-zinc-400">
        <p>
          The keyword was: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{keyword}</span>
        </p>
        <p>
          GPT-4o guessed: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{guess}</span>
        </p>
      </div>
      <button
        onClick={onPlayAgain}
        className="mt-2 rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Play Again
      </button>
    </div>
  );
}
