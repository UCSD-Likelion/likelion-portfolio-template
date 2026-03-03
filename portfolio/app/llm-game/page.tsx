"use client";

import { useRef, useState } from "react";
import DrawingCanvas, { DrawingCanvasHandle } from "./_components/drawing-canvas";
import GameResult from "./_components/game-result";

const KEYWORDS = [
  "dog", "cat", "house", "car", "tree",
  "sun", "flower", "fish", "star", "moon",
  "bird", "boat", "apple", "hat", "cup",
];

type GameState = "idle" | "drawing" | "submitting" | "result";

function pickRandom(): string {
  return KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
}

function checkMatch(keyword: string, guess: string): boolean {
  const k = keyword.toLowerCase();
  const g = guess.toLowerCase();
  return g.includes(k) || k.includes(g);
}

export default function LLMGamePage() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [state, setState] = useState<GameState>("idle");
  const [keyword, setKeyword] = useState("");
  const [guess, setGuess] = useState("");
  const [isWin, setIsWin] = useState(false);
  const [error, setError] = useState("");

  const startGame = () => {
    setKeyword(pickRandom());
    setGuess("");
    setIsWin(false);
    setError("");
    setState("drawing");
    // Clear canvas after a tick so the ref is mounted
    setTimeout(() => canvasRef.current?.clear(), 0);
  };

  const submitDrawing = async () => {
    if (!canvasRef.current) return;
    setState("submitting");
    setError("");

    try {
      const image = canvasRef.current.toDataURL();
      const res = await fetch("/api/llm-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();
      const llmGuess: string = data.guess;
      setGuess(llmGuess);
      setIsWin(checkMatch(keyword, llmGuess));
      setState("result");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("drawing");
    }
  };

  const clearCanvas = () => {
    canvasRef.current?.clear();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          LLM Drawing Game
        </h1>

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-lg text-zinc-600 dark:text-zinc-400">
              You&apos;ll get a random keyword to draw. Submit your drawing and
              see if GPT-4o can guess it!
            </p>
            <button
              onClick={startGame}
              className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Start Game
            </button>
          </div>
        )}

        {(state === "drawing" || state === "submitting") && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Draw:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {keyword}
              </span>
            </p>

            <DrawingCanvas ref={canvasRef} />

            <div className="flex gap-3">
              <button
                onClick={clearCanvas}
                disabled={state === "submitting"}
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Clear
              </button>
              <button
                onClick={submitDrawing}
                disabled={state === "submitting"}
                className="rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
              >
                {state === "submitting" ? "Analyzing..." : "Submit"}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        {state === "result" && (
          <GameResult
            keyword={keyword}
            guess={guess}
            isWin={isWin}
            onPlayAgain={startGame}
          />
        )}
      </main>
    </div>
  );
}
