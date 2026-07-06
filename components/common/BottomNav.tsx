import Link from "next/link";
import { Home, List, Sparkles } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: List },
  { href: "/story/demo-alpha-beta", label: "Story", icon: Sparkles },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce8d8] bg-white/95 px-4 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#395047] transition hover:bg-[#eef7ec]"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
