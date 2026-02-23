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
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

import { colors } from '../../src/theme/colors';
import { useGame } from '../../src/hooks/useGame';
import { EventImage } from '../../src/components/EventImage';
import { ScoreBar } from '../../src/components/ScoreBar';
import { HintSection } from '../../src/components/HintSection';
import { GameFeedback } from '../../src/components/GameFeedback';
import { GlassCard } from '../../src/components/GlassCard';
import { ERA_INFO, Era } from '../../src/data/models';

const ACCENT_COLORS: [string, string] = ['#EA580C', '#C2410C'];

const ERA_KEYS = Object.keys(ERA_INFO) as Era[];

export default function EraExplorerScreen() {
  const router = useRouter();
  const {
    gameState,
    startEraExplorer,
    submitAnswer,
    revealHint,
    nextEvent,
    giveUp,
    isGameComplete,
  } = useGame();

  useEffect(() => {
    startEraExplorer();
  }, []);

  const currentEvent = gameState.events[gameState.currentIndex];
  const revealedHints = currentEvent
    ? currentEvent.hints.slice(0, gameState.hintsRevealed)
    : [];

  const handleSelectEra = (eraKey: string) => {
    if (gameState.isAnswered) return;
    submitAnswer(eraKey);
  };

  const handleNext = () => {
    if (isGameComplete) {
      router.replace({
        pathname: '/results',
        params: {
          score: String(gameState.score),
          mode: gameState.mode,
          total: String(gameState.events.length),
          streak: String(gameState.bestStreak),
        },
      });
    } else {
      nextEvent();
    }
  };

  if (!currentEvent) {
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
          <View style={styles.scoreBarWrapper}>
            <ScoreBar
              score={gameState.score}
              streak={gameState.streak}
              currentQuestion={gameState.currentIndex}
              totalQuestions={gameState.events.length}
            />
          </View>
        </Animated.View>

        {/* Event Image */}
        <Animated.View entering={FadeIn.duration(600).delay(100)}>
          <EventImage
            imageSource={gameState.imageUri}
            isLoading={gameState.imageLoading}
          />
        </Animated.View>

        {/* Event Name */}
        <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.eventNameSection}>
          <Text style={styles.eventName}>{currentEvent.name}</Text>
        </Animated.View>

        {/* Game Content */}
        {!gameState.isAnswered ? (
          <Animated.View entering={FadeIn.duration(500).delay(300)} style={styles.gameContent}>
            <Text style={styles.promptText}>Which era does this event belong to?</Text>

            {/* Era Options */}
            <View style={styles.eraGrid}>
              {ERA_KEYS.map((eraKey, index) => {
                const info = ERA_INFO[eraKey];
                return (
                  <Animated.View
                    key={eraKey}
                    entering={SlideInRight.duration(300).delay(350 + index * 60)}
                  >
                    <Pressable
                      onPress={() => handleSelectEra(eraKey)}
                      style={({ pressed }) => [
                        styles.eraOption,
                        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                      ]}
                    >
                      <View style={styles.eraOptionInner}>
                        <Text style={styles.eraEmoji}>{info.emoji}</Text>
                        <View style={styles.eraTextColumn}>
                          <Text style={styles.eraName}>{info.name}</Text>
                          <Text style={styles.eraSpan}>{info.span}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Hints */}
            <View style={styles.hintWrapper}>
              <HintSection
                hints={revealedHints}
                totalHints={currentEvent.hints.length}
                onRevealHint={revealHint}
              />
            </View>

            <Pressable onPress={giveUp} style={styles.giveUpButton}>
              <MaterialIcons name="flag" size={16} color={colors.error} />
              <Text style={styles.giveUpText}>Give Up</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.gameContent}>
            <GameFeedback
              isCorrect={gameState.isCorrect}
              event={currentEvent}
              pointsEarned={gameState.isCorrect ? gameState.score : 0}
              isLastQuestion={isGameComplete}
              onNext={handleNext}
              accentColors={ACCENT_COLORS}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.questionSurface },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  scoreBarWrapper: { flex: 1 },
  eventNameSection: { marginTop: 16, alignItems: 'center' },
  eventName: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center',
  },
  gameContent: { marginTop: 20 },
  promptText: {
    fontSize: 16, fontWeight: '600', color: colors.textPrimary,
    marginBottom: 14, textAlign: 'center',
  },
  eraGrid: { gap: 8 },
  eraOption: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  eraOptionInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  eraEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  eraTextColumn: { flex: 1 },
  eraName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  eraSpan: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  hintWrapper: { marginTop: 20 },
  giveUpButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignSelf: 'center',
  },
  giveUpText: { fontSize: 14, color: colors.error, fontWeight: '600' },
});
