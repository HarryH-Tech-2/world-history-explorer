import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ScoreBarProps {
  score: number;
  streak: number;
  currentQuestion: number;
  totalQuestions: number;
}

export function ScoreBar({ score, streak, currentQuestion, totalQuestions }: ScoreBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <MaterialIcons name="star" size={20} color={colors.amber500} />
        <Text style={styles.scoreText}>{score}</Text>
      </View>

      <Text style={styles.progress}>
        {currentQuestion + 1} / {totalQuestions}
      </Text>

      {streak > 0 ? (
        <View style={styles.stat}>
          <MaterialIcons name="local-fire-department" size={20} color={colors.orange500} />
          <Text style={[styles.scoreText, { color: colors.orange500 }]}>{streak}</Text>
        </View>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    color: colors.amber500,
    fontSize: 16,
    fontWeight: '700',
  },
  progress: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
