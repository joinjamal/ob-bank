"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

export default function ToolFrame({
  title,
  description,
  children,
  defaultOpen = false
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className={`tool-frame surface-card ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-lg font-black text-ink">{title}</span>
          {description && <span className="mt-1 block text-sm font-bold text-ink/55">{description}</span>}
        </span>
        <span className="tool-frame-icon grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-ink/5 text-ink transition">
          <ChevronDown size={18} />
        </span>
      </button>
      {isOpen && (
        <div id={contentId} className="settings-stack border-t border-ink/5 p-4">
          {children}
        </div>
      )}
    </section>
  );
}
