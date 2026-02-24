import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors } from '../../src/theme/colors';
import { useGame } from '../../src/hooks/useGame';
import { useStorage } from '../../src/hooks/useStorage';
import { MAX_GUESSES, MASCOTS } from '../../src/data/models';
import { EventImage } from '../../src/components/EventImage';
import { ScoreBar } from '../../src/components/ScoreBar';
import { HintSection } from '../../src/components/HintSection';
import { TimerDisplay } from '../../src/components/TimerDisplay';
import { GameFeedback } from '../../src/components/GameFeedback';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientButton } from '../../src/components/GradientButton';

const ACCENT_COLORS: [string, string] = ['#7C3AED', '#6D28D9'];

export default function TimedGameScreen() {
  const router = useRouter();
  const {
    gameState,
    startClassicGame,
    submitAnswer,
    revealHint,
    nextEvent,
    giveUp,
    isGameComplete,
  } = useGame();
  const { profile } = useStorage();
  const mascot = MASCOTS.find(m => m.id === profile.mascot) ?? MASCOTS[0];
  const [yearInput, setYearInput] = useState('');
  const [isBCE, setIsBCE] = useState(false);

  useEffect(() => {
    startClassicGame(true);
  }, []);

  const currentEvent = gameState.events[gameState.currentIndex];
  const revealedHints = currentEvent
    ? currentEvent.hints.slice(0, gameState.hintsRevealed)
    : [];

  const guessesLeft = MAX_GUESSES - gameState.guessesUsed;

  const handleSubmit = () => {
    if (!yearInput.trim()) return;
    const answer = isBCE ? `-${yearInput.trim()}` : yearInput.trim();
    submitAnswer(answer);
    setYearInput('');
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
      setIsBCE(false);
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <TimerDisplay timeRemaining={gameState.timeRemaining} />
          </Animated.View>

          {/* Event Name */}
          <Animated.View entering={FadeIn.duration(500).delay(50)}>
            <Text style={styles.eventNameBanner}>{currentEvent.name}</Text>
          </Animated.View>

          {/* Event Image */}
          <Animated.View entering={FadeIn.duration(600).delay(100)}>
            <EventImage
              imageSource={gameState.imageUri}
              isLoading={gameState.imageLoading}
            />
          </Animated.View>

          {/* Game Content */}
          {!gameState.isAnswered ? (
            <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.gameContent}>
              {/* Guesses indicator */}
              <View style={styles.guessesRow}>
                {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.guessDot, i < gameState.guessesUsed && styles.guessDotUsed]}
                  />
                ))}
                <Text style={styles.guessesText}>
                  {guessesLeft} {guessesLeft === 1 ? 'guess' : 'guesses'} remaining
                </Text>
              </View>

              {gameState.guessesUsed > 0 && !gameState.isAnswered && (
                <View style={styles.wrongGuessBar}>
                  <MaterialIcons name="close" size={16} color={colors.error} />
                  <Text style={styles.wrongGuessText}>Not quite! Try again.</Text>
                </View>
              )}

              {/* Year Input */}
              <GlassCard style={styles.inputCard}>
                <Text style={styles.promptText}>When did this event occur?</Text>
                <View style={styles.inputRow}>
                  <MaterialIcons name="date-range" size={22} color="#7C3AED" />
                  <TextInput
                    value={yearInput}
                    onChangeText={setYearInput}
                    placeholder="Enter year (e.g. 1776)"
                    placeholderTextColor={colors.slate400}
                    style={styles.textInput}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <View style={styles.eraToggle}>
                    <Pressable
                      onPress={() => setIsBCE(true)}
                      style={[styles.eraOption, isBCE && styles.eraOptionActive]}
                    >
                      <Text style={[styles.eraOptionText, isBCE && styles.eraOptionTextActive]}>BCE</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIsBCE(false)}
                      style={[styles.eraOption, !isBCE && styles.eraOptionActive]}
                    >
                      <Text style={[styles.eraOptionText, !isBCE && styles.eraOptionTextActive]}>CE</Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>

              {/* Submit Button */}
              <GradientButton
                text="Submit Answer"
                onPress={handleSubmit}
                icon="send"
                gradientColors={ACCENT_COLORS}
                disabled={!yearInput.trim()}
                style={styles.submitButton}
              />

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
                mascotId={profile.mascot}
                mascotName={mascot.name}
              />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.questionSurface },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  scoreBarWrapper: { flex: 1 },
  eventNameBanner: {
    fontSize: 18, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginBottom: 12,
  },
  gameContent: { marginTop: 20 },
  guessesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  guessDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DDD6FE' },
  guessDotUsed: { backgroundColor: colors.error },
  guessesText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4, fontWeight: '500' },
  wrongGuessBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12,
  },
  wrongGuessText: { fontSize: 13, color: colors.error, fontWeight: '500' },
  inputCard: { marginBottom: 0 },
  promptText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, paddingHorizontal: 16, borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)', gap: 12,
  },
  textInput: { flex: 1, height: 52, color: colors.textPrimary, fontSize: 16 },
  submitButton: { marginTop: 16 },
  hintWrapper: { marginTop: 20 },
  giveUpButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignSelf: 'center',
  },
  giveUpText: { fontSize: 14, color: colors.error, fontWeight: '600' },
  eraToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginLeft: 10,
  },
  eraOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eraOptionActive: {
    backgroundColor: '#7C3AED',
  },
  eraOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  eraOptionTextActive: {
    color: colors.white,
  },
});
