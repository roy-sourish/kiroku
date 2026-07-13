import { useEffect, useState } from "react";

const PHRASES = [
  "Letting the ink dry…",
  "Summoning the knowledge cat…",
  "Overengineering your notes…",
  "記録 in progress…",
  "Fine. Doing your homework…",
  "Chasing the thought…",
  "Pretending to be smart…",
];

export default function AILoadingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length);
    }, 2000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 py-2 text-gray-500">
      <img src="/orange-cat.png" alt="" className="w-10 h-10 cat-party" />
     
      <span>{PHRASES[index]}</span>
    </div>
  );
}
