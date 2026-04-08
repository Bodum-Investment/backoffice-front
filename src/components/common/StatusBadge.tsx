interface StatusBadgeProps {
  value: string;
  labelMap?: Record<string, string>;
  colorMap?: Record<string, string>;
}

const DEFAULT_LABELS: Record<string, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DELETED: '삭제',
  UPCOMING: '예정',
  ONGOING: '진행중',
  ENDED: '종료',
};

const DEFAULT_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  DELETED: 'gray',
  UPCOMING: 'blue',
  ONGOING: 'green',
  ENDED: 'gray',
};

export default function StatusBadge({ value, labelMap, colorMap }: StatusBadgeProps) {
  const label = (labelMap ?? DEFAULT_LABELS)[value] ?? value;
  const color = (colorMap ?? DEFAULT_COLORS)[value] ?? 'gray';

  return (
    <span className={`badge badge--${color}`}>
      {label}
    </span>
  );
}
