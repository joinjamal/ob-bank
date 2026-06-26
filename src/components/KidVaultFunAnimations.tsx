"use client";

import { Sparkles, Star, Trophy, Zap } from "lucide-react";
import type { CSSProperties } from "react";

export default function KidVaultFunAnimations({ themeColor }: { themeColor: string }) {
  return (
    <section
      className="kid-fun-stage surface-card overflow-hidden p-4"
      style={{ "--kid-theme-color": themeColor } as CSSProperties}
      aria-hidden="true"
    >
      <div className="fun-orbit">
        <span className="fun-coin fun-coin-a">5</span>
        <span className="fun-coin fun-coin-b">10</span>
        <span className="fun-coin fun-coin-c">25</span>
      </div>
      <div className="fun-runner">
        <span className="fun-runner-body" />
        <span className="fun-runner-leg fun-runner-leg-a" />
        <span className="fun-runner-leg fun-runner-leg-b" />
      </div>
      <div className="fun-progress">
        <span />
      </div>
      <div className="fun-badges">
        <Trophy className="fun-badge fun-badge-a" size={22} />
        <Star className="fun-badge fun-badge-b" size={20} />
        <Zap className="fun-badge fun-badge-c" size={20} />
      </div>
      <div className="fun-sparkles">
        <Sparkles className="fun-sparkle fun-sparkle-a" size={18} />
        <Sparkles className="fun-sparkle fun-sparkle-b" size={16} />
        <Sparkles className="fun-sparkle fun-sparkle-c" size={14} />
      </div>
    </section>
  );
}
