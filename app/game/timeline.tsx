import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

import { colors } from '../../src/theme/colors';
import { useGame } from '../../src/hooks/useGame';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientButton } from '../../src/components/GradientButton';
import { formatYear } from '../../src/utils/score';
import { HistoricalEvent } from '../../src/data/models';

const ACCENT_COLORS: [string, string] = ['#2563EB', '#1D4ED8'];

export default function TimelineGameScreen() {
  const router = useRouter();
  const {
    gameState,
    timelineState,
    startTimeline,
    moveTimelineEvent,
    submitTimeline,
  } = useGame();

  useEffect(() => {
    startTimeline();
  }, []);

  const handleSeeResults = () => {
    router.replace({
      pathname: '/results',
      params: {
        score: String(gameState.score),
        mode: gameState.mode,
        total: String(timelineState.events.length),
        streak: String(gameState.bestStreak),
      },
    });
  };

  if (timelineState.userOrder.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={ACCENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerBadge}
            >
              <MaterialIcons name="swap-vert" size={18} color={colors.white} />
              <Text style={styles.headerBadgeText}>Timeline</Text>
            </LinearGradient>
          </View>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeIn.duration(500).delay(100)}>
          <GlassCard style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Arrange in chronological order</Text>
            <Text style={styles.instructionsSubtitle}>
              Drag events or use the arrows to reorder them
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Event List */}
        <View style={styles.eventList}>
          {timelineState.userOrder.map((event: HistoricalEvent, index: number) => {
            const isCorrectPlacement = timelineState.isSubmitted
              ? timelineState.events[index] === event
              : null;

            return (
              <Animated.View
                key={event.id}
                entering={SlideInRight.duration(400).delay(200 + index * 80)}
              >
                <DraggableEventCard
                  event={event}
                  index={index}
                  totalCount={timelineState.userOrder.length}
                  isSubmitted={timelineState.isSubmitted}
                  isCorrectPlacement={isCorrectPlacement}
                  onMoveUp={() => moveTimelineEvent(index, index - 1)}
                  onMoveDown={() => moveTimelineEvent(index, index + 1)}
                  onDragMove={moveTimelineEvent}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Results or Submit */}
        {timelineState.isSubmitted ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.resultsSection}>
            <GlassCard style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>
                {timelineState.correctPlacements}/{timelineState.events.length}
              </Text>
              <Text style={styles.scoreSubtext}>events in correct position</Text>
            </GlassCard>

            <View style={styles.correctOrderSection}>
              <Text style={styles.correctOrderTitle}>Correct Chronological Order</Text>
              {timelineState.events.map((event: HistoricalEvent, index: number) => (
                <View key={event.id} style={styles.correctOrderItem}>
                  <View style={styles.correctOrderBadge}>
                    <Text style={styles.correctOrderNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.correctOrderName} numberOfLines={1}>
                    {event.name}
                  </Text>
                  <Text style={styles.correctOrderYear}>{formatYear(event.year)}</Text>
                </View>
              ))}
            </View>

            <GradientButton
              text="See Results"
              onPress={handleSeeResults}
              icon="emoji-events"
              gradientColors={[colors.amber500, colors.orange]}
              style={styles.actionButton}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(500).delay(600)}>
            <GradientButton
              text="Submit Order"
              onPress={submitTimeline}
              icon="check"
              gradientColors={ACCENT_COLORS}
              style={styles.actionButton}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DraggableEventCard({
  event,
  index,
  totalCount,
  isSubmitted,
  isCorrectPlacement,
  onMoveUp,
  onMoveDown,
  onDragMove,
}: {
  event: HistoricalEvent;
  index: number;
  totalCount: number;
  isSubmitted: boolean;
  isCorrectPlacement: boolean | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragMove: (from: number, to: number) => void;
}) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const cardScale = useSharedValue(1);

  const CARD_HEIGHT = 90; // approximate height of each card + gap

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      isDragging.value = true;
      cardScale.value = withSpring(1.03);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      cardScale.value = withSpring(1);

      const movedPositions = Math.round(translateY.value / CARD_HEIGHT);
      const newIndex = Math.max(0, Math.min(totalCount - 1, index + movedPositions));

      translateY.value = withSpring(0);

      if (newIndex !== index) {
        runOnJS(onDragMove)(index, newIndex);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: cardScale.value },
    ],
    zIndex: isDragging.value ? 100 : 0,
    shadowOpacity: isDragging.value ? 0.15 : 0.06,
    elevation: isDragging.value ? 10 : 3,
  }));

  const cardContent = (
    <GlassCard
      style={{
        ...styles.eventCard,
        ...(isSubmitted && isCorrectPlacement ? styles.eventCardCorrect : {}),
        ...(isSubmitted && isCorrectPlacement === false ? styles.eventCardIncorrect : {}),
      }}
    >
      <View style={styles.eventCardContent}>
        {/* Drag handle */}
        {!isSubmitted && (
          <View style={styles.dragHandle}>
            <MaterialIcons name="drag-indicator" size={24} color={colors.slate400} />
          </View>
        )}

        {/* Position number */}
        <View
          style={[
            styles.positionBadge,
            isSubmitted && isCorrectPlacement && styles.positionBadgeCorrect,
            isSubmitted && isCorrectPlacement === false && styles.positionBadgeIncorrect,
          ]}
        >
          <Text style={styles.positionText}>{index + 1}</Text>
        </View>

        {/* Event details */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={2}>
            {event.name}
          </Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
          {isSubmitted && (
            <View style={styles.yearRow}>
              <MaterialIcons
                name="calendar-today"
                size={13}
                color={isCorrectPlacement ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.yearText,
                  { color: isCorrectPlacement ? colors.success : colors.error },
                ]}
              >
                {formatYear(event.year)}
              </Text>
            </View>
          )}
        </View>

        {/* Arrow buttons or result icon */}
        {!isSubmitted ? (
          <View style={styles.arrowColumn}>
            <Pressable
              onPress={onMoveUp}
              disabled={index === 0}
              style={({ pressed }) => [
                styles.arrowButton,
                { opacity: index === 0 ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <MaterialIcons name="keyboard-arrow-up" size={24} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={index === totalCount - 1}
              style={({ pressed }) => [
                styles.arrowButton,
                { opacity: index === totalCount - 1 ? 0.3 : pressed ? 0.6 : 1 },
              ]}
            >
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.resultIcon}>
            <MaterialIcons
              name={isCorrectPlacement ? 'check-circle' : 'cancel'}
              size={28}
              color={isCorrectPlacement ? colors.success : colors.error}
            />
          </View>
        )}
      </View>
    </GlassCard>
  );

  if (isSubmitted) {
    return <View>{cardContent}</View>;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {cardContent}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.questionSurface },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6,
  },
  headerBadgeText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  instructionsCard: { marginBottom: 16 },
  instructionsTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  instructionsSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  eventList: { gap: 10 },
  eventCard: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  eventCardCorrect: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.05)' },
  eventCardIncorrect: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.05)' },
  eventCardContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dragHandle: { paddingRight: 4 },
  positionBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  positionBadgeCorrect: { backgroundColor: 'rgba(34,197,94,0.15)' },
  positionBadgeIncorrect: { backgroundColor: 'rgba(239,68,68,0.15)' },
  positionText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  eventDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  yearRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  yearText: { fontSize: 12, fontWeight: '600' },
  arrowColumn: { gap: 4 },
  arrowButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  resultIcon: { width: 36, alignItems: 'center', justifyContent: 'center' },
  resultsSection: { marginTop: 20 },
  scoreCard: { alignItems: 'center', marginBottom: 16 },
  scoreLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  scoreValue: { fontSize: 36, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  scoreSubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  correctOrderSection: { marginBottom: 20 },
  correctOrderTitle: { fontSize: 14, fontWeight: '600', color: colors.orange500, marginBottom: 10 },
  correctOrderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(37,99,235,0.05)', borderRadius: 10, marginBottom: 6, gap: 10,
  },
  correctOrderBadge: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  correctOrderNumber: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  correctOrderName: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  correctOrderYear: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  actionButton: { marginTop: 16 },
});
