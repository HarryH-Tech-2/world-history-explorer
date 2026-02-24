import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ScoreBarProps {
  score: number;
  streak: number;
  currentQuestion: number;
  totalQuestions: number;
  accentColor?: string;
}

export function ScoreBar({ score, streak, currentQuestion, totalQuestions, accentColor = colors.orange500 }: ScoreBarProps) {
  const progress = totalQuestions > 0 ? (currentQuestion + 1) / totalQuestions : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.stat}>
          <MaterialIcons name="star" size={18} color={colors.amber500} />
          <Text style={styles.scoreText}>{score}</Text>
        </View>

        <Text style={styles.progress}>
          {currentQuestion + 1} / {totalQuestions}
        </Text>

        {streak > 0 ? (
          <View style={styles.stat}>
            <MaterialIcons name="local-fire-department" size={18} color={colors.orange500} />
            <Text style={[styles.scoreText, { color: colors.orange500 }]}>{streak}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress * 100}%`, backgroundColor: accentColor },
          ]}
        />
        {/* Dots for each question */}
        <View style={styles.progressDots}>
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= currentQuestion && { backgroundColor: colors.white, opacity: 1 },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scoreText: {
    color: colors.amber500,
    fontSize: 15,
    fontWeight: '700',
  },
  progress: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressDots: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  progressDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    opacity: 0.5,
  },
});
