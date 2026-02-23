import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Difficulty } from '../data/models';

const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; text: string; label: string }> = {
  easy: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', label: 'Easy' },
  medium: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'Medium' },
  hard: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Hard' },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const s = DIFFICULTY_STYLES[difficulty];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
