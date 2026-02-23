export interface HistoricalEvent {
  id: number;
  name: string;
  era: Era;
  year: number;
  location: string;
  description: string;
  funFact: string;
  difficulty: Difficulty;
  imagePrompt: string;
  hints: string[];
  acceptedAnswers: string[];
}

export type Era =
  | 'ancient'
  | 'classical'
  | 'medieval'
  | 'renaissance'
  | 'enlightenment'
  | 'modern'
  | 'contemporary';

export const ERA_INFO: Record<Era, { name: string; emoji: string; span: string }> = {
  ancient: { name: 'Ancient World', emoji: '\uD83C\uDFDB', span: '3000 BCE - 500 BCE' },
  classical: { name: 'Classical Era', emoji: '\u2694\uFE0F', span: '500 BCE - 500 CE' },
  medieval: { name: 'Medieval Period', emoji: '\uD83C\uDFF0', span: '500 - 1500' },
  renaissance: { name: 'Renaissance', emoji: '\uD83C\uDFA8', span: '1400 - 1700' },
  enlightenment: { name: 'Age of Revolution', emoji: '\uD83D\uDD2D', span: '1700 - 1850' },
  modern: { name: 'Modern Era', emoji: '\u2699\uFE0F', span: '1850 - 1950' },
  contemporary: { name: 'Contemporary', emoji: '\uD83D\uDE80', span: '1950 - Present' },
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 300,
};

export type MascotId = 'explorer_m1' | 'explorer_m2' | 'explorer_f1' | 'explorer_f2';

export interface MascotInfo {
  id: MascotId;
  name: string;
  emoji: string;
  color: string;
}

export const MASCOTS: MascotInfo[] = [
  { id: 'explorer_m1', name: 'Marco', emoji: '\uD83E\uDDD4', color: '#F97316' },
  { id: 'explorer_m2', name: 'Atlas', emoji: '\uD83D\uDC68\u200D\uD83C\uDF93', color: '#2563EB' },
  { id: 'explorer_f1', name: 'Cleo', emoji: '\uD83D\uDC69\u200D\uD83D\uDD2C', color: '#DB2777' },
  { id: 'explorer_f2', name: 'Athena', emoji: '\uD83E\uDDD5', color: '#7C3AED' },
];

export type GameModeId =
  | 'classic'
  | 'timed'
  | 'timeline'
  | 'daily'
  | 'era_explorer'
  | 'map_quest';

export interface GameModeInfo {
  id: GameModeId;
  name: string;
  description: string;
  icon: string;
  gradientStart: string;
  gradientEnd: string;
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Guess the historical event from an AI-generated image',
    icon: 'image',
    gradientStart: '#F97316',
    gradientEnd: '#EA580C',
  },
  {
    id: 'timed',
    name: 'Timed',
    description: 'Race against the clock! Faster answers earn bonus points',
    icon: 'timer',
    gradientStart: '#7C3AED',
    gradientEnd: '#6D28D9',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Arrange 5 events in the correct chronological order',
    icon: 'swap-vert',
    gradientStart: '#2563EB',
    gradientEnd: '#1D4ED8',
  },
  {
    id: 'daily',
    name: 'Daily Discovery',
    description: '5 new events every day. Compare scores with the world!',
    icon: 'calendar-today',
    gradientStart: '#DB2777',
    gradientEnd: '#BE185D',
  },
  {
    id: 'era_explorer',
    name: 'Era Explorer',
    description: 'Given an event name, guess what century it happened in',
    icon: 'explore',
    gradientStart: '#EA580C',
    gradientEnd: '#C2410C',
  },
  {
    id: 'map_quest',
    name: 'Map Quest',
    description: 'Given an event, guess where in the world it took place',
    icon: 'map',
    gradientStart: '#0891B2',
    gradientEnd: '#0E7490',
  },
];

export const MAX_GUESSES = 3;

export interface GameState {
  mode: string;
  events: HistoricalEvent[];
  currentIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  hintsRevealed: number;
  isAnswered: boolean;
  isCorrect: boolean;
  isTimed: boolean;
  timeRemaining: number;
  imageUri: string | null;
  imageLoading: boolean;
  guessesUsed: number;
}

export interface TimelineState {
  events: HistoricalEvent[];
  userOrder: HistoricalEvent[];
  isSubmitted: boolean;
  correctPlacements: number;
  score: number;
}

export interface UserProfile {
  name: string;
  mascot: MascotId;
  totalGamesPlayed: number;
  totalScore: number;
  bestScore: number;
  bestStreak: number;
  correctAnswers: number;
  totalAnswers: number;
  achievements: string[];
  dailyStreak: number;
  hasCompletedOnboarding: boolean;
  answeredEventIds: number[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'First Discovery', description: 'Get your first correct answer', icon: 'emoji-events' },
  { id: 'streak_5', name: 'On a Roll', description: 'Get a 5-answer streak', icon: 'local-fire-department' },
  { id: 'streak_10', name: 'Unstoppable', description: 'Get a 10-answer streak', icon: 'whatshot' },
  { id: 'perfect_game', name: 'Perfect Explorer', description: 'Get all 5 correct in a game', icon: 'star' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Answer in under 5 seconds', icon: 'flash-on' },
  { id: 'hint_free', name: 'No Hints Needed', description: 'Complete a game without hints', icon: 'psychology' },
  { id: 'era_master', name: 'Era Master', description: 'Get 10 correct in a single era', icon: 'school' },
  { id: 'century_scholar', name: 'Century Scholar', description: 'Play 100 total games', icon: 'military-tech' },
  { id: 'daily_devotee', name: 'Daily Devotee', description: 'Complete 7 daily challenges', icon: 'date-range' },
  { id: 'hard_mode', name: 'History Professor', description: 'Get 5 hard correct in a row', icon: 'workspace-premium' },
];
