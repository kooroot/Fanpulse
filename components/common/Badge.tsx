import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "green" | "blue" | "orange" | "ink" | "light";
};

const tones = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  ink: "border-[#284335] bg-[#10261c] text-white",
  light: "border-[#dce8d8] bg-white text-[#395047]",
};

export function Badge({ children, tone = "light" }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
