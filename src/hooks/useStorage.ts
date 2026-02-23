import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, MascotId } from '../data/models';

const STORAGE_KEY = 'user_profile';

const defaultProfile: UserProfile = {
  name: 'Explorer',
  mascot: 'explorer_m1',
  totalGamesPlayed: 0,
  totalScore: 0,
  bestScore: 0,
  bestStreak: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  achievements: [],
  dailyStreak: 0,
  hasCompletedOnboarding: false,
  answeredEventIds: [],
};

export function useStorage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  const persistProfile = async (updated: UserProfile): Promise<void> => {
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: UserProfile = { ...defaultProfile, ...parsed };
        setProfile(merged);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(defaultProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (name: string, mascot: MascotId): Promise<void> => {
    const updated: UserProfile = {
      ...profile,
      name,
      mascot,
      hasCompletedOnboarding: true,
    };
    await persistProfile(updated);
  };

  const updateName = async (name: string): Promise<void> => {
    const updated: UserProfile = {
      ...profile,
      name,
    };
    await persistProfile(updated);
  };

  const recordGameResult = async (
    score: number,
    correctCount: number,
    totalCount: number,
    bestStreak: number,
    eventIds?: number[],
  ): Promise<void> => {
    const newAnswered = eventIds
      ? [...new Set([...profile.answeredEventIds, ...eventIds])]
      : profile.answeredEventIds;
    const updated: UserProfile = {
      ...profile,
      totalGamesPlayed: profile.totalGamesPlayed + 1,
      totalScore: profile.totalScore + score,
      bestScore: Math.max(profile.bestScore, score),
      bestStreak: Math.max(profile.bestStreak, bestStreak),
      correctAnswers: profile.correctAnswers + correctCount,
      totalAnswers: profile.totalAnswers + totalCount,
      answeredEventIds: newAnswered,
    };
    await persistProfile(updated);
  };

  const unlockAchievement = async (id: string): Promise<void> => {
    if (profile.achievements.includes(id)) {
      return;
    }
    const updated: UserProfile = {
      ...profile,
      achievements: [...profile.achievements, id],
    };
    await persistProfile(updated);
  };

  const updateDailyStreak = async (): Promise<void> => {
    const updated: UserProfile = {
      ...profile,
      dailyStreak: profile.dailyStreak + 1,
    };
    await persistProfile(updated);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    isLoading,
    loadProfile,
    completeOnboarding,
    updateName,
    recordGameResult,
    unlockAchievement,
    updateDailyStreak,
  };
}
