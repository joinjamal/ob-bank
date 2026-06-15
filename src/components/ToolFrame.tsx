"use client";

import { ChevronDown } from "lucide-react";
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
  return (
    <details className="tool-frame rounded-[8px] bg-white shadow-lift" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <span className="min-w-0">
          <span className="block text-lg font-black text-ink">{title}</span>
          {description && <span className="mt-1 block text-sm font-bold text-ink/55">{description}</span>}
        </span>
        <span className="tool-frame-icon grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-ink/5 text-ink transition">
          <ChevronDown size={18} />
        </span>
      </summary>
      <div className="space-y-4 border-t border-ink/5 p-4 [&>section]:bg-transparent [&>section]:p-0 [&>section]:shadow-none">
        {children}
      </div>
    </details>
  );
}
