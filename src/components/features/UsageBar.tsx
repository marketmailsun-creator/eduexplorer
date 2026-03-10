import Link from 'next/link';

interface UsageBarProps {
  plan: 'free' | 'pro';
  lessonsUsed: number;
  lessonsLimit: number;
}

export function UsageBar({ plan, lessonsUsed, lessonsLimit }: UsageBarProps) {
  const remaining = Math.max(0, lessonsLimit - lessonsUsed);
  const pct = Math.min(100, Math.round((lessonsUsed / lessonsLimit) * 100));

  const barColor =
    pct >= 80 ? 'bg-red-500' :
    pct >= 60 ? 'bg-amber-500' :
    plan === 'pro' ? 'bg-emerald-500' : 'bg-violet-500';

  const trackColor =
    pct >= 80 ? 'bg-red-100' :
    pct >= 60 ? 'bg-amber-100' : 'bg-gray-200';

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm mb-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs font-medium text-gray-600">
            <span>
              AI Lessons Today
              {plan === 'pro' && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                  PRO
                </span>
              )}
            </span>
            <span className={remaining === 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              {remaining}/{lessonsLimit} remaining
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full ${trackColor}`}>
            <div
              className={`h-1.5 rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {plan === 'free' && (
        <Link
          href="/upgrade"
          className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-800 whitespace-nowrap"
        >
          Get 15/day →
        </Link>
      )}
    </div>
  );
}
