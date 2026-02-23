import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { useStorage } from '../../src/hooks/useStorage';
import { GAME_MODES, GameModeId, MASCOTS } from '../../src/data/models';
import { colors } from '../../src/theme/colors';
import { generateHomeBackground, generateMascotImage } from '../../src/services/gemini';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

const GAME_ROUTES: Record<GameModeId, string> = {
  classic: '/game/classic',
  timed: '/game/timed',
  timeline: '/game/timeline',
  daily: '/game/daily',
  era_explorer: '/game/era-explorer',
  map_quest: '/game/map-quest',
};

function AnimatedSkyBackground({ bgImage }: { bgImage: string | null }) {
  const cloudX1 = useSharedValue(-100);
  const cloudX2 = useSharedValue(-200);

  useEffect(() => {
    cloudX1.value = withRepeat(
      withTiming(width + 100, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    cloudX2.value = withRepeat(
      withTiming(width + 200, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const cloud1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX1.value }],
  }));

  const cloud2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX2.value }],
  }));

  if (bgImage) {
    return (
      <View style={styles.skyBackground}>
        <Image
          source={{ uri: `data:image/png;base64,${bgImage}` }}
          style={styles.bgImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(245,245,245,0.6)', colors.surface]}
          locations={[0.2, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.cloud, cloud1Style, { top: 30 }]}>
          <View style={styles.cloudShape} />
        </Animated.View>
        <Animated.View style={[styles.cloud, cloud2Style, { top: 70 }]}>
          <View style={[styles.cloudShape, { width: 60, height: 24 }]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#87CEEB', '#B8E4F9', '#E8F4FD', colors.surface]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.skyBackground}
    >
      <Animated.View style={[styles.cloud, cloud1Style, { top: 30 }]}>
        <View style={styles.cloudShape} />
      </Animated.View>
      <Animated.View style={[styles.cloud, cloud2Style, { top: 70 }]}>
        <View style={[styles.cloudShape, { width: 60, height: 24 }]} />
      </Animated.View>
    </LinearGradient>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useStorage();
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [mascotImage, setMascotImage] = useState<string | null>(null);

  const mascot = MASCOTS.find(m => m.id === profile.mascot) || MASCOTS[0];

  // Load Gemini background + mascot image
  useEffect(() => {
    generateHomeBackground().then(img => {
      if (img) setBgImage(img);
    });
  }, []);

  useEffect(() => {
    if (profile.mascot) {
      generateMascotImage(profile.mascot).then(img => {
        if (img) setMascotImage(img);
      });
    }
  }, [profile.mascot]);

  const navigateToGame = (modeId: GameModeId) => {
    router.push(GAME_ROUTES[modeId] as any);
  };

  return (
    <View style={styles.container}>
      <AnimatedSkyBackground bgImage={bgImage} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <View style={styles.nameRow}>
                {mascotImage ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${mascotImage}` }}
                    style={styles.mascotAvatar}
                  />
                ) : (
                  <Text style={styles.mascotEmoji}>{mascot.emoji}</Text>
                )}
                <Text style={styles.nameText}>{profile.name}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.settingsButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <MaterialIcons name="settings" size={26} color={colors.textSecondary} />
            </Pressable>
          </Animated.View>

          {/* Stats Summary */}
          <Animated.View entering={FadeIn.duration(600).delay(150)}>
            <GlassCard style={styles.statsCard}>
              <View style={styles.statsRow}>
                <StatItem icon="sports-esports" value={profile.totalGamesPlayed} label="Games" />
                <View style={styles.statsDivider} />
                <StatItem icon="emoji-events" value={profile.bestScore} label="Best Score" />
                <View style={styles.statsDivider} />
                <StatItem icon="local-fire-department" value={profile.bestStreak} label="Best Streak" />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Section Title */}
          <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Game Modes</Text>
            <Text style={styles.sectionSubtitle}>Choose your challenge</Text>
          </Animated.View>

          {/* Game Mode Grid */}
          <View style={styles.grid}>
            {GAME_MODES.map((mode, index) => (
              <Animated.View
                key={mode.id}
                entering={SlideInRight.duration(400).delay(400 + index * 80)}
                style={styles.gridItem}
              >
                <GlassCard
                  onPress={() => navigateToGame(mode.id)}
                  style={styles.modeCard}
                >
                  <LinearGradient
                    colors={[mode.gradientStart, mode.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modeIconBox}
                  >
                    <MaterialIcons
                      name={mode.icon as keyof typeof MaterialIcons.glyphMap}
                      size={28}
                      color={colors.white}
                    />
                  </LinearGradient>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modeDescription} numberOfLines={2}>
                    {mode.description}
                  </Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <MaterialIcons name={icon} size={22} color={colors.orange500} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  cloud: {
    position: 'absolute',
  },
  cloudShape: {
    width: 80,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  mascotEmoji: {
    fontSize: 24,
  },
  mascotAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.orange200,
  },
  nameText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  modeCard: {
    minHeight: 160,
  },
  modeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
