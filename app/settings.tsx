import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { useStorage } from '../src/hooks/useStorage';
import { useMusic } from '../src/hooks/useMusic';
import { colors } from '../src/theme/colors';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateName, loadProfile } = useStorage();
  const { currentTrackId, isMuted, toggleMute, selectTrack, tracks } = useMusic();
  const [editedName, setEditedName] = useState(profile.name);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setEditedName(profile.name);
  }, [profile.name]);

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    await updateName(trimmed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress? This will clear your scores, achievements, and stats. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user_profile');
            await loadProfile();
            setEditedName('Explorer');
          },
        },
      ]
    );
  };

  const nameHasChanged = editedName.trim() !== profile.name;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Player Name Section */}
        <Animated.View entering={SlideInRight.duration(400).delay(100)}>
          <Text style={styles.sectionTitle}>Player Name</Text>
          <GlassCard>
            <View style={styles.nameInputRow}>
              <MaterialIcons
                name="badge"
                size={22}
                color={colors.orange500}
                style={styles.nameIcon}
              />
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={colors.slate400}
                style={styles.nameInput}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                maxLength={24}
              />
            </View>
            <GradientButton
              text={isSaved ? 'Saved!' : 'Save Name'}
              onPress={handleSaveName}
              icon={isSaved ? 'check' : 'save'}
              disabled={!nameHasChanged || !editedName.trim()}
              gradientColors={
                isSaved
                  ? [colors.success, '#16A34A']
                  : [colors.orange500, colors.orange600]
              }
              style={styles.saveButton}
            />
          </GlassCard>
        </Animated.View>

        {/* Music Section */}
        <Animated.View entering={SlideInRight.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Music</Text>
          <GlassCard>
            {/* Mute toggle */}
            <Pressable onPress={toggleMute} style={styles.muteRow}>
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={22}
                color={isMuted ? colors.slate400 : colors.orange500}
              />
              <Text style={styles.muteLabel}>
                {isMuted ? 'Music Off' : 'Music On'}
              </Text>
              <View style={[styles.muteToggle, isMuted && styles.muteToggleOff]}>
                <View style={[styles.muteToggleDot, isMuted && styles.muteToggleDotOff]} />
              </View>
            </Pressable>

            <View style={styles.trackDivider} />

            {/* Track list */}
            <Text style={styles.trackListLabel}>Select Track</Text>
            {tracks.map(track => {
              const isActive = track.id === currentTrackId;
              return (
                <Pressable
                  key={track.id}
                  onPress={() => selectTrack(track.id)}
                  style={[styles.trackRow, isActive && styles.trackRowActive]}
                >
                  <MaterialIcons
                    name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={isActive ? colors.orange500 : colors.slate400}
                  />
                  <Text style={[styles.trackName, isActive && styles.trackNameActive]}>
                    {track.name}
                  </Text>
                  {isActive && !isMuted && (
                    <MaterialIcons name="equalizer" size={18} color={colors.orange500} />
                  )}
                </Pressable>
              );
            })}
          </GlassCard>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={SlideInRight.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>About</Text>
          <GlassCard>
            <SettingsRow
              icon="info-outline"
              label="Version"
              value={APP_VERSION}
            />
          </GlassCard>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={SlideInRight.duration(400).delay(400)}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <GlassCard style={styles.dangerCard}>
            <View style={styles.dangerContent}>
              <View style={styles.dangerTextBlock}>
                <Text style={styles.dangerTitle}>Reset Progress</Text>
                <Text style={styles.dangerDescription}>
                  Clear all scores, achievements, and stats. This cannot be
                  undone.
                </Text>
              </View>
              <Pressable
                onPress={handleResetProgress}
                style={({ pressed }) => [
                  styles.resetButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <MaterialIcons name="delete-forever" size={20} color={colors.error} />
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.settingsRow}>
      <MaterialIcons name={icon} size={20} color={colors.orange500} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
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
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  nameIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 2,
  },
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  muteLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  muteToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange500,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  muteToggleOff: {
    backgroundColor: colors.slate300,
  },
  muteToggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignSelf: 'flex-end',
  },
  muteToggleDotOff: {
    alignSelf: 'flex-start',
  },
  trackDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
  trackListLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 10,
    marginBottom: 4,
  },
  trackRowActive: {
    backgroundColor: 'rgba(249,115,22,0.06)',
  },
  trackName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  trackNameActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingsLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  settingsValue: {
    fontSize: 15,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  dangerDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
});
