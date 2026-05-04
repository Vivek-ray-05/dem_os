import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export default function SectionCard({ children, className = "", glow = false }: Props) {
  return (
    <div
      className={`bg-surface border border-white/5 rounded-2xl p-5 relative overflow-hidden ${
        glow ? "shadow-[0_0_40px_rgba(0,180,216,0.03)]" : "shadow-xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}
