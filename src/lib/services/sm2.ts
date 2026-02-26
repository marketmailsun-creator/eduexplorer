/**
 * SuperMemo 2 (SM-2) spaced repetition algorithm.
 * Quality ratings: 1=Again, 2=Hard, 4=Good, 5=Easy
 * Returns updated card state and next due date.
 */

export interface SM2Card {
  easeFactor: number;   // starts at 2.5, min 1.3
  interval: number;     // days until next review; 0=new
  repetitions: number;  // number of successful reviews
}

export type SM2Quality = 1 | 2 | 4 | 5; // Again | Hard | Good | Easy

export interface SM2Result extends SM2Card {
  dueDate: Date;
}

export function calculateSM2(card: SM2Card, quality: SM2Quality): SM2Result {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset repetitions, short interval
    repetitions = 0;
    interval = quality === 1 ? 0 : 1; // Again: review same session; Hard: next day
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { easeFactor, interval, repetitions, dueDate };
}

export const SM2_LABELS: Record<SM2Quality, { label: string; color: string; description: string }> = {
  1: { label: 'Again',  color: 'bg-red-500 hover:bg-red-600',       description: 'Forgot completely' },
  2: { label: 'Hard',   color: 'bg-orange-500 hover:bg-orange-600', description: 'Remembered with difficulty' },
  4: { label: 'Good',   color: 'bg-blue-500 hover:bg-blue-600',     description: 'Remembered correctly' },
  5: { label: 'Easy',   color: 'bg-green-500 hover:bg-green-600',   description: 'Remembered easily' },
};
