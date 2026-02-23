import { useState, useRef, useCallback } from 'react';
import { HistoricalEvent, GameState, TimelineState, MAX_GUESSES } from '../data/models';
import { allHistoricalEvents } from '../data/events';
import { EVENT_IMAGES } from '../data/imageRegistry';
import { calculateScore, calculateTimeBonus } from '../utils/score';

const EVENTS_PER_GAME = 5;
const TIMED_SECONDS = 30;

const initialGameState: GameState = {
  mode: 'classic',
  events: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  hintsRevealed: 0,
  isAnswered: false,
  isCorrect: false,
  isTimed: false,
  timeRemaining: 0,
  imageUri: null,
  imageLoading: false,
  guessesUsed: 0,
};

const initialTimelineState: TimelineState = {
  events: [],
  userOrder: [],
  isSubmitted: false,
  score: 0,
  correctPlacements: 0,
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandom(count: number): HistoricalEvent[] {
  const shuffled = [...allHistoricalEvents].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickSeededByDate(count: number): HistoricalEvent[] {
  const seed = new Date().toISOString().split('T')[0];
  const hash = hashString(seed);
  const rng = seededRandom(hash);
  const shuffled = shuffleArray([...allHistoricalEvents], rng);
  return shuffled.slice(0, count);
}

function pickSpreadYears(count: number): HistoricalEvent[] {
  const sorted = [...allHistoricalEvents].sort((a, b) => a.year - b.year);
  if (sorted.length <= count) return sorted;

  const step = Math.floor(sorted.length / count);
  const picked: HistoricalEvent[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.min(i * step + Math.floor(Math.random() * step), sorted.length - 1);
    picked.push(sorted[index]);
  }
  return picked;
}

function loadImageForEvent(
  event: HistoricalEvent,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
): void {
  const imageSource = EVENT_IMAGES[event.id] ?? null;
  setGameState((prev) => ({ ...prev, imageUri: imageSource, imageLoading: false }));
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [timelineState, setTimelineState] = useState<TimelineState>(initialTimelineState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearTimer();
          return {
            ...prev,
            timeRemaining: 0,
            isAnswered: true,
            isCorrect: false,
          };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, [clearTimer]);

  const startClassicGame = useCallback((isTimed = false): void => {
    clearTimer();
    const events = pickRandom(EVENTS_PER_GAME);
    const newState: GameState = {
      ...initialGameState,
      mode: 'classic',
      events,
      isTimed,
      timeRemaining: isTimed ? TIMED_SECONDS : 0,
    };
    setGameState(newState);
    setTimelineState(initialTimelineState);
    loadImageForEvent(events[0], setGameState);
    if (isTimed) {
      startTimer();
    }
  }, [clearTimer, startTimer]);

  const startDailyChallenge = useCallback((): void => {
    clearTimer();
    const events = pickSeededByDate(EVENTS_PER_GAME);
    const newState: GameState = {
      ...initialGameState,
      mode: 'daily',
      events,
      isTimed: true,
      timeRemaining: TIMED_SECONDS,
    };
    setGameState(newState);
    setTimelineState(initialTimelineState);
    loadImageForEvent(events[0], setGameState);
    startTimer();
  }, [clearTimer, startTimer]);

  const startEraExplorer = useCallback((): void => {
    clearTimer();
    const events = pickRandom(EVENTS_PER_GAME);
    const newState: GameState = {
      ...initialGameState,
      mode: 'era',
      events,
    };
    setGameState(newState);
    setTimelineState(initialTimelineState);
    loadImageForEvent(events[0], setGameState);
  }, [clearTimer]);

  const startMapQuest = useCallback((): void => {
    clearTimer();
    const events = pickRandom(EVENTS_PER_GAME);
    const newState: GameState = {
      ...initialGameState,
      mode: 'map',
      events,
    };
    setGameState(newState);
    setTimelineState(initialTimelineState);
    loadImageForEvent(events[0], setGameState);
  }, [clearTimer]);

  const startTimeline = useCallback((): void => {
    clearTimer();
    const events = pickSpreadYears(EVENTS_PER_GAME);
    const sorted = [...events].sort((a, b) => a.year - b.year);
    const shuffled = [...events].sort(() => Math.random() - 0.5);

    setGameState({
      ...initialGameState,
      mode: 'timeline',
      events: sorted,
    });
    setTimelineState({
      events: sorted,
      userOrder: shuffled,
      isSubmitted: false,
      score: 0,
      correctPlacements: 0,
    });
  }, [clearTimer]);

  const submitAnswer = useCallback((answer: string): void => {
    if (gameState.isAnswered) return;

    const currentEvent = gameState.events[gameState.currentIndex];
    if (!currentEvent) return;

    let isCorrect = false;

    switch (gameState.mode) {
      case 'classic':
      case 'daily': {
        const guessedYear = parseInt(answer, 10);
        if (!isNaN(guessedYear)) {
          isCorrect = Math.abs(guessedYear - currentEvent.year) <= 10;
        }
        break;
      }
      case 'era': {
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedEra = currentEvent.era?.toLowerCase().trim() ?? '';
        isCorrect = normalizedAnswer === normalizedEra;
        break;
      }
      case 'map': {
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedLocation = currentEvent.location?.toLowerCase().trim() ?? '';
        isCorrect =
          normalizedAnswer === normalizedLocation ||
          normalizedLocation.includes(normalizedAnswer);
        break;
      }
      default:
        break;
    }

    const newGuessesUsed = gameState.guessesUsed + 1;

    if (isCorrect) {
      clearTimer();
      const timeBonus =
        gameState.isTimed ? calculateTimeBonus(gameState.timeRemaining, TIMED_SECONDS) : 0;
      const pointsEarned = calculateScore(currentEvent.difficulty, gameState.hintsRevealed, gameState.streak, timeBonus);
      const newStreak = gameState.streak + 1;
      const newBestStreak = Math.max(gameState.bestStreak, newStreak);

      setGameState((prev) => ({
        ...prev,
        isAnswered: true,
        isCorrect: true,
        score: prev.score + pointsEarned,
        streak: newStreak,
        bestStreak: newBestStreak,
        guessesUsed: newGuessesUsed,
      }));
    } else if (newGuessesUsed >= MAX_GUESSES) {
      clearTimer();
      setGameState((prev) => ({
        ...prev,
        isAnswered: true,
        isCorrect: false,
        streak: 0,
        guessesUsed: newGuessesUsed,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        guessesUsed: newGuessesUsed,
      }));
    }
  }, [gameState, clearTimer]);

  const revealHint = useCallback((): void => {
    if (gameState.isAnswered) return;

    const currentEvent = gameState.events[gameState.currentIndex];
    if (!currentEvent) return;

    const maxHints = currentEvent.hints?.length ?? 0;
    if (gameState.hintsRevealed >= maxHints) return;

    setGameState((prev) => ({
      ...prev,
      hintsRevealed: prev.hintsRevealed + 1,
    }));
  }, [gameState]);

  const nextEvent = useCallback((): void => {
    const nextIndex = gameState.currentIndex + 1;
    if (nextIndex >= gameState.events.length) return;

    clearTimer();

    const nextEvt = gameState.events[nextIndex];
    setGameState((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      isAnswered: false,
      isCorrect: false,
      hintsRevealed: 0,
      imageUri: null,
      imageLoading: false,
      timeRemaining: prev.isTimed ? TIMED_SECONDS : 0,
      guessesUsed: 0,
    }));

    loadImageForEvent(nextEvt, setGameState);

    if (gameState.isTimed) {
      startTimer();
    }
  }, [gameState, clearTimer, startTimer]);

  const moveTimelineEvent = useCallback((from: number, to: number): void => {
    if (timelineState.isSubmitted) return;

    setTimelineState((prev) => {
      const newOrder = [...prev.userOrder];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(to, 0, moved);
      return { ...prev, userOrder: newOrder };
    });
  }, [timelineState.isSubmitted]);

  const submitTimeline = useCallback((): void => {
    if (timelineState.isSubmitted) return;

    const correctOrder = timelineState.events;
    const userOrder = timelineState.userOrder;

    let correctPlacements = 0;
    for (let i = 0; i < userOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) {
        correctPlacements++;
      }
    }

    const score = Math.round((correctPlacements / correctOrder.length) * 1000);

    setTimelineState((prev) => ({
      ...prev,
      isSubmitted: true,
      score,
      correctPlacements,
    }));

    setGameState((prev) => ({
      ...prev,
      score: prev.score + score,
      isAnswered: true,
    }));
  }, [timelineState]);

  const giveUp = useCallback((): void => {
    if (gameState.isAnswered) return;
    clearTimer();
    setGameState((prev) => ({
      ...prev,
      isAnswered: true,
      isCorrect: false,
      streak: 0,
    }));
  }, [gameState, clearTimer]);

  const isGameComplete =
    gameState.isAnswered && gameState.currentIndex >= gameState.events.length - 1;

  return {
    gameState,
    timelineState,
    startClassicGame,
    startDailyChallenge,
    startEraExplorer,
    startMapQuest,
    startTimeline,
    submitAnswer,
    revealHint,
    nextEvent,
    moveTimelineEvent,
    submitTimeline,
    giveUp,
    isGameComplete,
  };
}
