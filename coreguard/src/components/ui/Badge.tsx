type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'new' | 'reviewed' | 'escalated' | 'ignored' | 'resolved' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const badgeClasses: Record<BadgeVariant, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-purple-100 text-purple-800',
  escalated: 'bg-red-100 text-red-800',
  ignored: 'bg-gray-100 text-gray-600',
  resolved: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-800',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[variant]}`}>
      {children}
    </span>
  );
}