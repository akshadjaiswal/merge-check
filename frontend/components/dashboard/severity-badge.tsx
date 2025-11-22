import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Severity = 'critical' | 'warning' | 'suggestion';

interface SeverityBadgeProps {
  severity: Severity;
  count?: number;
  className?: string;
}

const severityConfig = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    className: 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    className: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  },
  suggestion: {
    label: 'Suggestion',
    icon: Info,
    className: 'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200',
  },
};

export function SeverityBadge({ severity, count, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className, 'gap-1 font-medium')}
    >
      <Icon className="w-3 h-3" />
      {config.label}
      {count !== undefined && <span className="ml-1">({count})</span>}
    </Badge>
  );
}
