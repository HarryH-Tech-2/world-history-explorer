import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HistoricalEvent } from '../data/models';
import { MASCOT_IMAGES } from '../data/imageRegistry';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { colors } from '../theme/colors';
import { formatYear } from '../utils/score';

const CORRECT_MESSAGES = ["Brilliant!", "You nailed it!", "Amazing work!", "Spectacular!", "History genius!"];
const INCORRECT_MESSAGES = ["Don't worry!", "You'll get it next time!", "Keep exploring!", "Almost there!", "Learning is winning!"];

interface GameFeedbackProps {
  isCorrect: boolean;
  event: HistoricalEvent;
  pointsEarned: number;
  isLastQuestion: boolean;
  onNext: () => void;
  accentColors?: [string, string];
  mascotId?: string;
  mascotName?: string;
}

export function GameFeedback({
  isCorrect,
  event,
  pointsEarned,
  isLastQuestion,
  onNext,
  accentColors = [colors.orange500, colors.orange600],
  mascotId,
  mascotName,
}: GameFeedbackProps) {
  const mascotMessage = useMemo(() => {
    const pool = isCorrect ? CORRECT_MESSAGES : INCORRECT_MESSAGES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [isCorrect]);

  return (
    <View style={styles.container}>
      {/* Result icon */}
      <View style={[styles.iconBox, { backgroundColor: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
        <MaterialIcons
          name={isCorrect ? 'check-circle' : 'cancel'}
          size={36}
          color={isCorrect ? colors.success : colors.error}
        />
      </View>

      <Text style={[styles.resultText, { color: isCorrect ? colors.success : colors.error }]}>
        {isCorrect ? 'Correct!' : 'Not quite!'}
      </Text>

      {isCorrect && pointsEarned > 0 && (
        <Text style={styles.points}>+{pointsEarned} points</Text>
      )}

      {mascotId && (
        <View style={styles.mascotRow}>
          <Image source={MASCOT_IMAGES[mascotId]} style={styles.mascotImage} />
          <View style={[styles.speechBubble, { backgroundColor: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }]}>
            <Text style={styles.speechText}>{mascotMessage}</Text>
            {mascotName && <Text style={styles.mascotLabel}>— {mascotName}</Text>}
          </View>
        </View>
      )}

      {/* Event info card */}
      <GlassCard style={styles.infoCard}>
        <Text style={styles.eventName}>{event.name}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="calendar-today" size={14} color={colors.orange500} />
          <Text style={styles.metaText}>{formatYear(event.year)}</Text>
          <MaterialIcons name="location-on" size={14} color={colors.orange500} style={{ marginLeft: 12 }} />
          <Text style={styles.metaText}>{event.location}</Text>
        </View>
        <Text style={styles.description}>{event.description}</Text>

        {/* Fun fact */}
        <View style={styles.funFactBox}>
          <MaterialIcons name="auto-awesome" size={16} color={colors.amber500} />
          <Text style={styles.funFactText}>{event.funFact}</Text>
        </View>
      </GlassCard>

      <GradientButton
        text={isLastQuestion ? 'See Results' : 'Next Event'}
        onPress={onNext}
        icon={isLastQuestion ? 'emoji-events' : 'arrow-forward'}
        gradientColors={isLastQuestion ? [colors.amber500, colors.orange500] : accentColors}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber500,
    marginTop: 4,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
  },
  mascotImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  speechBubble: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  speechText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mascotLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  infoCard: {
    width: '100%',
    marginTop: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.orange500,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 12,
  },
  funFactBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  funFactText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  button: {
    width: '100%',
    marginTop: 20,
  },
});
