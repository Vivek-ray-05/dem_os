"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Database, Disc, Share2 } from "lucide-react";

const ICONS = { cpu: Cpu, database: Database, disc: Disc, share: Share2 } as const;
type IconName = keyof typeof ICONS;

interface Props {
  href: string;
  iconName: IconName;
  label: string;
}

export default function NavLink({ href, iconName, label }: Props) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  const Icon = ICONS[iconName];

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
