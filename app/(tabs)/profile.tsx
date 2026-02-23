import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { useStorage } from '../../src/hooks/useStorage';
import { ACHIEVEMENTS, Achievement, MASCOTS } from '../../src/data/models';
import { colors } from '../../src/theme/colors';
import { generateMascotImage } from '../../src/services/gemini';

const { width } = Dimensions.get('window');
const STAT_GAP = 12;
const STAT_WIDTH = (width - 48 - STAT_GAP) / 2;

interface StatCardData {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  color: string;
}

export default function ProfileScreen() {
  const { profile, isLoading } = useStorage();
  const [mascotImage, setMascotImage] = useState<string | null>(null);

  const mascot = MASCOTS.find((m) => m.id === profile.mascot) ?? MASCOTS[0];

  useEffect(() => {
    generateMascotImage(profile.mascot).then((img) => {
      if (img) setMascotImage(img);
    });
  }, [profile.mascot]);

  const accuracy =
    profile.totalAnswers > 0
      ? Math.round((profile.correctAnswers / profile.totalAnswers) * 100)
      : 0;

  const stats: StatCardData[] = [
    {
      icon: 'sports-esports',
      value: profile.totalGamesPlayed.toLocaleString(),
      label: 'Total Games',
      color: colors.orange500,
    },
    {
      icon: 'star',
      value: profile.totalScore.toLocaleString(),
      label: 'Total Score',
      color: colors.amber500,
    },
    {
      icon: 'emoji-events',
      value: profile.bestScore.toLocaleString(),
      label: 'Best Score',
      color: colors.orange600,
    },
    {
      icon: 'local-fire-department',
      value: profile.bestStreak.toString(),
      label: 'Best Streak',
      color: colors.orange500,
    },
    {
      icon: 'track-changes',
      value: `${accuracy}%`,
      label: 'Accuracy',
      color: colors.success,
    },
    {
      icon: 'calendar-today',
      value: profile.dailyStreak.toString(),
      label: 'Daily Streak',
      color: '#DB2777',
    },
  ];

  const unlockedSet = new Set(profile.achievements);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.profileHeader}
        >
          <View style={[styles.avatarCircle, { backgroundColor: mascot.color + '18' }]}>
            {mascotImage ? (
              <Image
                source={{ uri: `data:image/png;base64,${mascotImage}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarEmoji}>{mascot.emoji}</Text>
            )}
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSubtitle}>{mascot.name} - History Explorer</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeIn.duration(600).delay(150)}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={SlideInRight.duration(400).delay(200 + index * 60)}
                style={styles.statsGridItem}
              >
                <GlassCard style={styles.statCard}>
                  <MaterialIcons
                    name={stat.icon}
                    size={24}
                    color={stat.color}
                  />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View entering={FadeIn.duration(600).delay(500)}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.achievementCount}>
              {profile.achievements.length}/{ACHIEVEMENTS.length}
            </Text>
          </View>
          <View style={styles.achievementsList}>
            {ACHIEVEMENTS.map((achievement, index) => {
              const isUnlocked = unlockedSet.has(achievement.id);
              return (
                <Animated.View
                  key={achievement.id}
                  entering={SlideInRight.duration(400).delay(
                    550 + index * 50
                  )}
                >
                  <AchievementRow
                    achievement={achievement}
                    isUnlocked={isUnlocked}
                  />
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Data & Privacy Policy */}
        <Animated.View entering={FadeIn.duration(600).delay(800)}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <GlassCard style={styles.policyCard}>
            <View style={styles.policyItem}>
              <View style={styles.policyIconBox}>
                <MaterialIcons name="storage" size={20} color={colors.orange500} />
              </View>
              <View style={styles.policyTextContent}>
                <Text style={styles.policyTitle}>Data Policy</Text>
                <Text style={styles.policyDescription}>
                  All game data is stored locally on your device. No personal information is collected or transmitted to external servers. Generated images are cached locally for performance.
                </Text>
              </View>
            </View>

            <View style={styles.policyDivider} />

            <View style={styles.policyItem}>
              <View style={styles.policyIconBox}>
                <MaterialIcons name="shield" size={20} color={colors.success} />
              </View>
              <View style={styles.policyTextContent}>
                <Text style={styles.policyTitle}>Privacy Policy</Text>
                <Text style={styles.policyDescription}>
                  We respect your privacy. Image prompts are sent to Google Gemini API for generation only. No tracking, analytics, or third-party data sharing occurs. You can clear all cached data from Settings at any time.
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementRow({
  achievement,
  isUnlocked,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
}) {
  return (
    <View
      style={[
        styles.achievementRow,
        !isUnlocked && styles.achievementLocked,
      ]}
    >
      <View
        style={[
          styles.achievementIconBox,
          isUnlocked
            ? styles.achievementIconUnlocked
            : styles.achievementIconLockedBg,
        ]}
      >
        {isUnlocked ? (
          <MaterialIcons
            name={achievement.icon as keyof typeof MaterialIcons.glyphMap}
            size={24}
            color={colors.amber500}
          />
        ) : (
          <MaterialIcons name="lock" size={20} color={colors.slate400} />
        )}
      </View>
      <View style={styles.achievementText}>
        <Text
          style={[
            styles.achievementName,
            !isUnlocked && styles.achievementNameLocked,
          ]}
        >
          {achievement.name}
        </Text>
        <Text
          style={[
            styles.achievementDesc,
            !isUnlocked && styles.achievementDescLocked,
          ]}
        >
          {achievement.description}
        </Text>
      </View>
      {isUnlocked && (
        <MaterialIcons name="check-circle" size={22} color={colors.success} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: STAT_GAP,
    marginBottom: 28,
  },
  statsGridItem: {
    width: STAT_WIDTH,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  achievementCount: {
    fontSize: 14,
    color: colors.orange500,
    fontWeight: '600',
  },
  achievementsList: {
    gap: 10,
    marginBottom: 28,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  achievementLocked: {
    opacity: 0.55,
  },
  achievementIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  achievementIconLockedBg: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  achievementText: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  achievementNameLocked: {
    color: colors.textSecondary,
  },
  achievementDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  achievementDescLocked: {
    color: colors.textTertiary,
  },
  policyCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  policyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  policyTextContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  policyDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 16,
  },
});
