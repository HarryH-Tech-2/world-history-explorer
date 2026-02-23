import { Difficulty } from '../data/models';

const BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 300,
};

export function calculateScore(
  difficulty: Difficulty,
  hintsUsed: number,
  streak: number,
  timeBonus?: number
): number {
  const base = BASE_POINTS[difficulty];
  const hintPenalty = hintsUsed * 25;
  const streakBonus = Math.min(streak * 10, 100);
  const total = base - hintPenalty + streakBonus + (timeBonus ?? 0);
  return Math.max(total, 10);
}

export function calculateTimeBonus(
  timeRemaining: number,
  totalTime: number = 30
): number {
  if (totalTime <= 0) return 0;
  const fraction = Math.max(0, Math.min(1, timeRemaining / totalTime));
  return Math.round(fraction * 50);
}

export function calculateTimelineScore(
  correctPositions: number,
  totalEvents: number
): number {
  if (totalEvents <= 0) return 0;
  const basePoints = Math.round((correctPositions / totalEvents) * 200);
  const perfectBonus = correctPositions === totalEvents ? 100 : 0;
  return basePoints + perfectBonus;
}

export function formatYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
}

export function getAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '#4CAF50';
    case 'medium':
      return '#FFC107';
    case 'hard':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

export function stringSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

export function checkAnswer(
  acceptedAnswers: string[],
  userAnswer: string
): boolean {
  const trimmed = userAnswer.trim();
  if (trimmed.length === 0) return false;

  return acceptedAnswers.some(
    (accepted) => stringSimilarity(accepted, trimmed) > 0.75
  );
}

export function checkYearAnswer(
  actualYear: number,
  guessedYear: number,
  tolerance: number = 50
): boolean {
  return Math.abs(actualYear - guessedYear) <= tolerance;
}

export function checkLocationAnswer(
  actualLocation: string,
  guessedLocation: string
): boolean {
  const guess = guessedLocation.trim().toLowerCase();
  if (guess.length === 0) return false;

  const locationParts = actualLocation
    .toLowerCase()
    .split(/[,\s]+/)
    .filter((part) => part.length > 2);

  return locationParts.some(
    (part) => guess.includes(part) || part.includes(guess)
  );
}
