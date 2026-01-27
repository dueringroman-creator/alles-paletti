import { cn } from '../utils/cn';
import type { BookingStatus, StopStatus, ReconciliationStatus } from '../types';

interface StatusBadgeProps {
  status: BookingStatus | StopStatus | ReconciliationStatus | string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // Booking statuses
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-indigo-100 text-indigo-800',
  reconciled: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  settled: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-500 line-through',

  // Stop statuses
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  awaiting_confirmation: 'bg-yellow-100 text-yellow-700',
  variance_detected: 'bg-red-100 text-red-700',

  // Reconciliation statuses
  detected: 'bg-orange-100 text-orange-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  proposed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  resolved: 'bg-green-200 text-green-800',
  closed: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  const displayText = status.replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {displayText}
    </span>
  );
}
