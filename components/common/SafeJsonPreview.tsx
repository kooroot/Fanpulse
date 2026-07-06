type SafeJsonPreviewProps = {
  data: unknown;
  enabled?: boolean;
};

export function SafeJsonPreview({ data, enabled = false }: SafeJsonPreviewProps) {
  if (!enabled) return null;

  return (
    <details className="rounded-lg border border-[#dce8d8] bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-[#395047]">
        Developer preview
      </summary>
      <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-[#10261c] p-3 text-xs text-white">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
