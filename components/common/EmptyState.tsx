import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  children: ReactNode;
};

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[#b7c9b2] bg-white p-5 text-center">
      <h2 className="text-base font-bold text-[#122018]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5d7167]">{children}</p>
    </div>
  );
}
