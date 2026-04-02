import { useState, useEffect, useRef } from "react";

interface StreamingTextProps {
  text: string;
  id: string;
  speed?: number;
  start?: boolean;
  onComplete?: () => void;
}

export function StreamingText({
  text,
  id,
  speed = 150,
  start = true,
  onComplete,
}: StreamingTextProps) {
  const fileId =
    typeof window !== "undefined"
      ? localStorage.getItem("fileId") || "default"
      : "default";
  const storageKey = `streamed_${fileId}_${id}`;
  const isCached =
    typeof window !== "undefined" &&
    sessionStorage.getItem(storageKey) === "true";
  const resetKey = `${id}:${start}:${isCached}:${text.length}`;

  return (
    <StreamingTextRunner
      key={resetKey}
      text={text}
      speed={speed}
      start={start}
      onComplete={onComplete}
      isCached={isCached}
      storageKey={storageKey}
    />
  );
}

interface StreamingTextRunnerProps {
  text: string;
  speed: number;
  start: boolean;
  onComplete?: () => void;
  isCached: boolean;
  storageKey: string;
}

function StreamingTextRunner({
  text,
  speed,
  start,
  onComplete,
  isCached,
  storageKey,
}: StreamingTextRunnerProps) {
  const words = text.split(" ");
  const [wordIndex, setWordIndex] = useState(
    start && isCached ? words.length : 0,
  );
  const hasNotifiedCompletion = useRef(false);

  useEffect(() => {
    if (!start || isCached) {
      return;
    }

    const intervalId = setInterval(() => {
      setWordIndex((current) => {
        const next = current + 1;
        if (next >= words.length) {
          sessionStorage.setItem(storageKey, "true");
          clearInterval(intervalId);
          return words.length;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(intervalId);
  }, [isCached, speed, start, storageKey, words.length]);

  useEffect(() => {
    if (!start || !onComplete || hasNotifiedCompletion.current) {
      return;
    }

    if (isCached || wordIndex >= words.length) {
      hasNotifiedCompletion.current = true;
      onComplete();
    }
  }, [isCached, onComplete, start, wordIndex, words.length]);

  const displayedText = start
    ? isCached
      ? text
      : words.slice(0, wordIndex).join(" ")
    : "";
  const isComplete = !start || isCached || wordIndex >= words.length;

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1.5 h-3 md:h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
      )}
    </span>
  );
}
