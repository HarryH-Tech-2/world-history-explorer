import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { useStorage } from '../../src/hooks/useStorage';
import { GAME_MODES, GameModeId, MASCOTS } from '../../src/data/models';
import { colors } from '../../src/theme/colors';
import { UI_IMAGES, MODE_ICONS, MASCOT_IMAGES } from '../../src/data/imageRegistry';
import { useMusic } from '../../src/hooks/useMusic';

const { width, height: screenHeight } = Dimensions.get('window');
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

/** A single realistic cloud made of multiple overlapping ellipses */
function RealisticCloud({
  x,
  y,
  scale,
  speed,
  delay: cloudDelay,
}: {
  x: number;
  y: number;
  scale: number;
  speed: number;
  delay: number;
}) {
  const translateX = useSharedValue(x);
  const drift = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      cloudDelay,
      withRepeat(
        withTiming(width + 200, { duration: speed, easing: Easing.linear }),
        -1,
        false
      )
    );
    drift.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: drift.value },
      { scale },
    ],
  }));

  return (
    <Animated.View style={[styles.cloudGroup, { top: y }, animStyle]}>
      {/* Main body */}
      <View style={[styles.cloudBlob, { width: 90, height: 32, borderRadius: 16, opacity: 0.55 }]} />
      {/* Top puffs */}
      <View style={[styles.cloudBlob, { width: 50, height: 28, borderRadius: 14, top: -12, left: 15, opacity: 0.5 }]} />
      <View style={[styles.cloudBlob, { width: 40, height: 24, borderRadius: 12, top: -8, left: 45, opacity: 0.45 }]} />
      {/* Wispy edges */}
      <View style={[styles.cloudBlob, { width: 30, height: 16, borderRadius: 8, top: 2, left: -10, opacity: 0.3 }]} />
      <View style={[styles.cloudBlob, { width: 28, height: 14, borderRadius: 7, top: 4, left: 75, opacity: 0.25 }]} />
    </Animated.View>
  );
}

function FloatingParticles() {
  const particles = useMemo(() => [
    { x: 40, y: 200, size: 6, speed: 6000, delay: 0 },
    { x: 150, y: 350, size: 4, speed: 8000, delay: 1000 },
    { x: 280, y: 150, size: 5, speed: 7000, delay: 2000 },
    { x: 60, y: 500, size: 3, speed: 9000, delay: 500 },
    { x: 200, y: 100, size: 7, speed: 5500, delay: 3000 },
    { x: 320, y: 400, size: 4, speed: 7500, delay: 1500 },
    { x: 100, y: 300, size: 5, speed: 6500, delay: 2500 },
    { x: 250, y: 550, size: 3, speed: 8500, delay: 800 },
  ], []);

  return (
    <>
      {particles.map((p, i) => (
        <FloatingDot key={i} {...p} />
      ))}
    </>
  );
}

function FloatingDot({ x, y, size, speed, delay: dotDelay }: { x: number; y: number; size: number; speed: number; delay: number }) {
  const floatY = useSharedValue(y);
  const floatX = useSharedValue(x);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(dotDelay, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    ));
    floatY.value = withDelay(dotDelay, withRepeat(
      withSequence(
        withTiming(y - 30, { duration: speed, easing: Easing.inOut(Easing.ease) }),
        withTiming(y + 30, { duration: speed, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    ));
    floatX.value = withDelay(dotDelay, withRepeat(
      withSequence(
        withTiming(x + 15, { duration: speed * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(x - 15, { duration: speed * 0.8, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: floatX.value,
    top: floatY.value,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: 'rgba(249,115,22,0.5)',
    opacity: opacity.value,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: size * 2,
  }));

  return <Animated.View style={style} />;
}

function AnimatedFullBackground() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.05, 0.12]),
  }));

  return (
    <View style={styles.fullBackground}>
      <Image
        source={UI_IMAGES.homeBackground}
        style={styles.bgImage}
        resizeMode="cover"
      />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(245,245,245,0.4)', 'rgba(245,245,245,0.8)', colors.surface]}
          locations={[0, 0.2, 0.45, 0.7]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(249,115,22,0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        {/* Realistic clouds */}
        <RealisticCloud x={-150} y={30} scale={1.1} speed={28000} delay={0} />
        <RealisticCloud x={-300} y={80} scale={0.8} speed={35000} delay={3000} />
        <RealisticCloud x={-100} y={140} scale={0.6} speed={22000} delay={8000} />
        <RealisticCloud x={-250} y={55} scale={0.9} speed={32000} delay={12000} />
        {/* Floating particles */}
        <FloatingParticles />
      </View>
    );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useStorage();
  const { isMuted, toggleMute, currentTrackId, selectTrack, tracks } = useMusic();
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const mascot = MASCOTS.find(m => m.id === profile.mascot) || MASCOTS[0];

  const navigateToGame = (modeId: GameModeId) => {
    router.push(GAME_ROUTES[modeId] as any);
  };

  return (
    <View style={styles.container}>
      <AnimatedFullBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <View style={styles.nameRow}>
                {MASCOT_IMAGES[profile.mascot] ? (
                  <Image
                    source={MASCOT_IMAGES[profile.mascot]}
                    style={styles.mascotAvatar}
                  />
                ) : (
                  <Text style={styles.mascotEmoji}>{mascot.emoji}</Text>
                )}
                <Text style={styles.nameText}>{profile.name}</Text>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => setShowMusicPicker(!showMusicPicker)}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MaterialIcons
                  name={isMuted ? 'volume-off' : 'volume-up'}
                  size={22}
                  color={isMuted ? colors.slate400 : colors.orange500}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Music Picker */}
          {showMusicPicker && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.musicPicker}>
              <View style={styles.musicPickerHeader}>
                <Text style={styles.musicPickerTitle}>Music</Text>
                <Pressable onPress={toggleMute} style={styles.muteToggle}>
                  <MaterialIcons
                    name={isMuted ? 'volume-off' : 'volume-up'}
                    size={20}
                    color={isMuted ? colors.slate400 : colors.orange500}
                  />
                  <Text style={styles.muteToggleText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </Pressable>
              </View>
              {tracks.map(track => (
                <Pressable
                  key={track.id}
                  onPress={() => { selectTrack(track.id); }}
                  style={[styles.trackItem, currentTrackId === track.id && styles.trackItemActive]}
                >
                  <MaterialIcons
                    name={currentTrackId === track.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={currentTrackId === track.id ? colors.orange500 : colors.slate400}
                  />
                  <Text style={[styles.trackName, currentTrackId === track.id && styles.trackNameActive]}>
                    {track.name}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Stats Summary */}
          <Animated.View entering={FadeInDown.duration(600).delay(150).springify()}>
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
            {GAME_MODES.map((mode, index) => {
              const iconImage = MODE_ICONS[mode.id];
              return (
                <Animated.View
                  key={mode.id}
                  entering={SlideInRight.duration(400).delay(400 + index * 80)}
                  style={styles.gridItem}
                >
                  <GlassCard
                    onPress={() => navigateToGame(mode.id)}
                    style={styles.modeCard}
                    innerStyle={styles.modeCardInner}
                  >
                    {iconImage ? (
                      <View style={styles.modeIconImageWrapper}>
                        <Image
                          source={iconImage}
                          style={styles.modeIconImage}
                        />
                      </View>
                    ) : (
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
                    )}
                    <Text style={styles.modeName}>{mode.name}</Text>
                    <Text style={styles.modeDescription}>
                      {mode.description}
                    </Text>
                  </GlassCard>
                </Animated.View>
              );
            })}
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
  fullBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cloudGroup: {
    position: 'absolute',
    width: 120,
    height: 50,
  },
  cloudBlob: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    justifyContent: 'center',
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  modeCard: {
    minHeight: 160,
  },
  modeCardInner: {
    alignItems: 'center',
  },
  modeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeIconImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modeIconImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    textAlign: 'center',
  },
  musicPicker: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  musicPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  musicPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  muteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  muteToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  trackItemActive: {
    backgroundColor: 'rgba(249,115,22,0.06)',
  },
  trackName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  trackNameActive: {
    color: colors.orange500,
    fontWeight: '600',
  },
});
