import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../src/theme/colors';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';

const MODE_LABELS: Record<string, string> = {
  classic: 'Classic',
  timed: 'Timed',
  timeline: 'Timeline',
  daily: 'Daily Discovery',
  era: 'Era Explorer',
  map: 'Map Quest',
};

function getStarRating(score: number, total: number): number {
  if (total <= 0) return 1;
  const ratio = score / (total * 200);
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    mode: string;
    total: string;
    streak: string;
  }>();

  const score = parseInt(params.score ?? '0', 10);
  const mode = params.mode ?? 'classic';
  const total = parseInt(params.total ?? '5', 10);
  const streak = parseInt(params.streak ?? '0', 10);
  const stars = getStarRating(score, total);

  // Trophy pulse animation
  const trophyScale = useSharedValue(1);

  useEffect(() => {
    trophyScale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      )
    );
  }, []);

  const trophyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const handlePlayAgain = () => {
    router.replace('/(tabs)');
  };

  const handleShareScore = async () => {
    const modeLabel = MODE_LABELS[mode] ?? mode;
    try {
      await Share.share({
        message: `I scored ${score} points in ${modeLabel} mode on History Explorer! Can you beat my score?`,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy */}
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.trophySection}
        >
          <Animated.View style={[styles.trophyWrapper, trophyAnimatedStyle]}>
            <LinearGradient
              colors={[colors.amber500, colors.orange500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trophyBox}
            >
              <MaterialIcons name="emoji-events" size={64} color={colors.white} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.titleSection}>
          <Text style={styles.congratsText}>
            {stars === 3 ? 'Outstanding!' : stars === 2 ? 'Well Done!' : 'Good Effort!'}
          </Text>
          <Text style={styles.modeText}>
            {MODE_LABELS[mode] ?? mode} Complete
          </Text>
        </Animated.View>

        {/* Score Display */}
        <Animated.View entering={FadeIn.duration(600).delay(400)}>
          <GlassCard style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Total Score</Text>
            <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3].map((starIndex) => (
                <Animated.View
                  key={starIndex}
                  entering={FadeIn.duration(400).delay(600 + starIndex * 150)}
                >
                  <MaterialIcons
                    name={starIndex <= stars ? 'star' : 'star-border'}
                    size={36}
                    color={starIndex <= stars ? colors.amber500 : colors.slate300}
                  />
                </Animated.View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={SlideInRight.duration(500).delay(700)} style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statIconBox}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statIconBox}>
              <MaterialIcons name="local-fire-department" size={24} color={colors.orange500} />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statIconBox}>
              <MaterialIcons name="sports-esports" size={24} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{MODE_LABELS[mode] ?? mode}</Text>
            <Text style={styles.statLabel}>Mode</Text>
          </GlassCard>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeIn.duration(500).delay(900)} style={styles.actionsSection}>
          <GradientButton
            text="Play Again"
            onPress={handlePlayAgain}
            icon="replay"
            gradientColors={[colors.orange500, colors.orange600]}
            style={styles.actionButton}
          />

          <GradientButton
            text="Share Score"
            onPress={handleShareScore}
            icon="share"
            gradientColors={[colors.amber500, colors.orange500]}
            style={styles.actionButton}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  trophySection: {
    marginTop: 20,
    alignItems: 'center',
  },
  trophyWrapper: {
    // animated scale applied here
  },
  trophyBox: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  congratsText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  scoreCard: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.orange500,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  actionsSection: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});
