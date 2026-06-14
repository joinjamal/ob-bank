"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ob-bank-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextIsDark = stored ? stored === "dark" : prefersDark;

    setIsDark(nextIsDark);
    applyTheme(nextIsDark);
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    applyTheme(nextIsDark);
    window.localStorage.setItem("ob-bank-theme", nextIsDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-3 font-black text-ink shadow-sm transition hover:-translate-y-0.5"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-knob">{isDark ? <Sun size={12} /> : <Moon size={12} />}</span>
      </span>
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
