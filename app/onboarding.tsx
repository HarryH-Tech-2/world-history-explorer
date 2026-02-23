import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { GradientButton } from '../src/components/GradientButton';
import { useStorage } from '../src/hooks/useStorage';
import { MASCOTS, MascotId } from '../src/data/models';
import { colors } from '../src/theme/colors';
import { generateMascotImage } from '../src/services/gemini';

const { width } = Dimensions.get('window');

interface Page {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  gradient: [string, string];
}

const PAGES: Page[] = [
  {
    icon: 'explore',
    title: 'Explore History',
    subtitle: 'Like Never Before',
    description:
      'Journey through 5,000 years of human civilization with AI-generated artwork that brings history to life',
    gradient: [colors.orange400, colors.orange600],
  },
  {
    icon: 'quiz',
    title: 'Test Your',
    subtitle: 'Knowledge',
    description:
      'Multiple game modes challenge you to identify events, arrange timelines, and discover new facts about the past',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    icon: 'emoji-events',
    title: 'Earn Achievements',
    subtitle: '& Climb the Ranks',
    description:
      'Build streaks, unlock achievements, and take on daily challenges to become a true history explorer',
    gradient: [colors.amber400, colors.orange],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useStorage();
  const [currentPage, setCurrentPage] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [selectedMascot, setSelectedMascot] = useState<MascotId>('explorer_m1');
  const flatListRef = useRef<FlatList>(null);
  const totalPages = PAGES.length + 2;

  const goToPage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentPage(index);
  };

  const handleComplete = async () => {
    const name = playerName.trim() || 'Explorer';
    await completeOnboarding(name, selectedMascot);
    router.replace('/(tabs)');
  };

  const allPages = [...PAGES, { icon: 'group' as const }, { icon: 'person' as const }];

  const renderPage = ({ item, index }: { item: any; index: number }) => {
    if (index < PAGES.length) {
      return <OnboardingPage page={PAGES[index]} />;
    }
    if (index === PAGES.length) {
      return (
        <MascotPickerPage
          selected={selectedMascot}
          onSelect={setSelectedMascot}
        />
      );
    }
    return (
      <NameInputPage
        name={playerName}
        onNameChange={setPlayerName}
        onSubmit={handleComplete}
      />
    );
  };

  const isLastPage = currentPage >= totalPages - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={allPages as any}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        keyExtractor={(_, i) => i.toString()}
        style={styles.pager}
      />

      <View style={styles.bottom}>
        <View style={styles.indicators}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentPage && styles.dotActive]}
            />
          ))}
        </View>

        {isLastPage ? (
          <GradientButton
            text="Start Exploring"
            onPress={handleComplete}
            icon="rocket-launch"
            gradientColors={[colors.orange500, colors.orange600]}
            style={styles.nextButton}
          />
        ) : (
          <>
            <GradientButton
              text="Next"
              onPress={() => goToPage(currentPage + 1)}
              icon="arrow-forward"
              gradientColors={[colors.orange500, colors.orange600]}
              style={styles.nextButton}
            />
            <Pressable onPress={() => goToPage(totalPages - 1)} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function OnboardingPage({ page }: { page: Page }) {
  const float = useSharedValue(0);
  React.useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(10, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <LinearGradient
          colors={page.gradient}
          style={styles.iconBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name={page.icon} size={48} color={colors.white} />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.title}>{page.title}</Text>
      <Text style={[styles.title, { color: page.gradient[0] }]}>{page.subtitle}</Text>
      <Text style={styles.description}>{page.description}</Text>
    </View>
  );
}

function MascotPickerPage({
  selected,
  onSelect,
}: {
  selected: MascotId;
  onSelect: (id: MascotId) => void;
}) {
  const [mascotImages, setMascotImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    MASCOTS.forEach((mascot) => {
      generateMascotImage(mascot.id).then((img) => {
        if (img) {
          setMascotImages((prev) => ({ ...prev, [mascot.id]: img }));
        }
      });
    });
  }, []);

  return (
    <View style={[styles.page, { width }]}>
      <Text style={styles.title}>Choose Your</Text>
      <Text style={[styles.title, { color: colors.orange500 }]}>Explorer</Text>
      <Text style={styles.mascotSubtitle}>Pick a mascot to represent you</Text>

      <View style={styles.mascotGrid}>
        {MASCOTS.map((mascot) => {
          const img = mascotImages[mascot.id];
          return (
            <Pressable
              key={mascot.id}
              onPress={() => onSelect(mascot.id)}
              style={({ pressed }) => [
                styles.mascotCard,
                selected === mascot.id && styles.mascotCardSelected,
                selected === mascot.id && { borderColor: mascot.color },
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              {img ? (
                <Image
                  source={{ uri: `data:image/png;base64,${img}` }}
                  style={styles.mascotImage}
                />
              ) : (
                <View style={styles.mascotImagePlaceholder}>
                  <Text style={styles.mascotEmoji}>{mascot.emoji}</Text>
                  <ActivityIndicator size="small" color={mascot.color} style={styles.mascotLoader} />
                </View>
              )}
              <Text style={[
                styles.mascotName,
                selected === mascot.id && { color: mascot.color },
              ]}>{mascot.name}</Text>
              {selected === mascot.id && (
                <View style={[styles.selectedBadge, { backgroundColor: mascot.color }]}>
                  <MaterialIcons name="check" size={14} color={colors.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NameInputPage({
  name,
  onNameChange,
  onSubmit,
}: {
  name: string;
  onNameChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.page, { width }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[colors.orange500, colors.orange600]}
        style={styles.iconBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name="person" size={48} color={colors.white} />
      </LinearGradient>

      <Text style={[styles.title, { marginTop: 40 }]}>What should we</Text>
      <Text style={[styles.title, { color: colors.orange500 }]}>call you?</Text>
      <Text style={styles.subtitle}>Enter your explorer name to get started</Text>

      <View style={styles.inputWrapper}>
        <MaterialIcons name="badge" size={22} color={colors.orange500} style={styles.inputIcon} />
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Explorer"
          placeholderTextColor={colors.slate400}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          autoCapitalize="words"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  pager: { flex: 1 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrapper: {},
  iconBox: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: 4 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  mascotSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  description: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 26 },
  bottom: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  indicators: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate300 },
  dotActive: { width: 32, backgroundColor: colors.orange500 },
  nextButton: { width: '100%' },
  skipButton: { marginTop: 12, paddingVertical: 8 },
  skipText: { color: colors.textSecondary, fontSize: 14 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 16, marginTop: 32, paddingHorizontal: 16, backgroundColor: colors.surface },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, color: colors.textPrimary, fontSize: 16 },
  mascotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, width: '100%' },
  mascotCard: { width: (width - 96) / 2, backgroundColor: colors.white, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)', paddingVertical: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mascotCardSelected: { borderWidth: 3, backgroundColor: 'rgba(249,115,22,0.04)' },
  mascotImage: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  mascotImagePlaceholder: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  mascotEmoji: { fontSize: 42 },
  mascotLoader: { position: 'absolute', bottom: 0, right: 0 },
  mascotName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  selectedBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
