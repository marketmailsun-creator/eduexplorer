'use client';

import { useEffect, useState } from 'react';

interface DayData {
  date: string;
  count: number;
}

function getColor(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-purple-200';
  if (count === 2) return 'bg-purple-400';
  if (count <= 4) return 'bg-purple-500';
  return 'bg-purple-700';
}

export function ActivityHeatmap() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/activity-heatmap')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(({ data }) => setData(data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Build a map of date -> count
  const countMap = new Map<string, number>(data.map(d => [d.date, d.count]));

  // Build the 53-week grid, starting from ~1 year ago aligned to Monday
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  // Align to start of week (Monday)
  const dayOfWeek = startDate.getDay(); // 0=Sun
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - offset);

  const weeks: { date: string; count: number }[][] = [];
  const current = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10);
      week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-900 text-sm">Activity</span>
        <span className="text-xs text-gray-400">
          {totalContributions} topic{totalContributions !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      {/* Heatmap grid — horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]" style={{ width: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[10px] h-[10px] rounded-[2px] ${getColor(day.count)}`}
                  title={`${day.date}: ${day.count} topic${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-gray-400 mr-1">Less</span>
        {(['bg-gray-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-700'] as const).map((c, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-gray-400 ml-1">More</span>
      </div>
    </div>
  );
}
