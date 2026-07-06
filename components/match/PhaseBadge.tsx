import { Badge } from "@/components/common/Badge";
import { formatPhase } from "@/lib/utils/format";

type PhaseBadgeProps = {
  phaseId?: number;
  fallback?: string;
};

export function PhaseBadge({ phaseId, fallback }: PhaseBadgeProps) {
  return <Badge tone="ink">{formatPhase(phaseId, fallback)}</Badge>;
}
