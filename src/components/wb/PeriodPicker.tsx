import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { days: 7, label: '7д' },
  { days: 30, label: '30д' },
  { days: 90, label: '90д' },
];

export default function PeriodPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted">
      {OPTIONS.map((o) => (
        <Button
          key={o.days}
          size="sm"
          variant="ghost"
          onClick={() => onChange(o.days)}
          className={cn('h-7 px-3 text-xs', value === o.days && 'bg-background shadow-sm')}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
