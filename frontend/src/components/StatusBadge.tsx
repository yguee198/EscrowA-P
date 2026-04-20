interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    HELD: 'bg-purple-100 text-purple-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status as keyof typeof colors] || colors.PENDING}`}>
      {status}
    </span>
  );
}