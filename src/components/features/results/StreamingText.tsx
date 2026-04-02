import { useState, useEffect } from "react";

interface StreamingTextProps {
  text: string;
  id: string;
  speed?: number;
}

export function StreamingText({ text, id, speed = 150 }: StreamingTextProps) {
  const words = text.split(" ");
  const fileId =
    typeof window !== "undefined"
      ? localStorage.getItem("fileId") || "default"
      : "default";
  const storageKey = `streamed_${fileId}_${id}`;
  const isCached =
    typeof window !== "undefined" &&
    sessionStorage.getItem(storageKey) === "true";

  const [wordIndex, setWordIndex] = useState(isCached ? words.length : 0);

  useEffect(() => {
    if (isCached) {
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

      if (wordIndex >= words.length) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [isCached, speed, storageKey, wordIndex, words.length]);

  const displayedText = isCached ? text : words.slice(0, wordIndex).join(" ");
  const isComplete = isCached || wordIndex >= words.length;

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1.5 h-3 md:h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
      )}
    </span>
  );
}
