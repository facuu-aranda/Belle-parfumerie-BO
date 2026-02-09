"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState<"default" | "card" | "button" | "link">("default");

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    if (dotRef.current) dotRef.current.style.display = "block";

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX + 14, y: e.clientY + 14 };
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-cursor='card']")) setHovering("card");
      else if (el.closest("button, [data-cursor='button']")) setHovering("button");
      else if (el.closest("a, [data-cursor='link']")) setHovering("link");
      else setHovering("default");
    };

    const onOut = () => setHovering("default");

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let raf: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.15);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.15);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  const sizeMap = {
    default: "h-3 w-3",
    card: "h-6 w-6",
    button: "h-5 w-5",
    link: "h-4 w-4",
  };

  const colorMap = {
    default: "bg-violet",
    card: "bg-lavender",
    button: "bg-mauve",
    link: "bg-violet-deep",
  };

  return (
    <div
      ref={dotRef}
      className={`pointer-events-none fixed left-0 top-0 z-9999 rounded-full transition-[width,height,background-color] duration-200 ease-out ${sizeMap[hovering]} ${colorMap[hovering]} opacity-70`}
      style={{ willChange: "transform", display: "none" }}
    />
  );
}
