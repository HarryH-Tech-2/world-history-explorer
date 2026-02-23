import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { useStorage } from '../../src/hooks/useStorage';
import { allHistoricalEvents } from '../../src/data/events';
import { ERA_INFO, Era } from '../../src/data/models';
import { colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { profile } = useStorage();

  const answeredSet = new Set(profile.answeredEventIds || []);
  const totalEvents = allHistoricalEvents.length;
  const answeredCount = answeredSet.size;
  const progressPercent = totalEvents > 0 ? Math.round((answeredCount / totalEvents) * 100) : 0;

  // Group events by era
  const eraGroups = (Object.keys(ERA_INFO) as Era[]).map(era => {
    const eraEvents = allHistoricalEvents.filter(e => e.era === era);
    const eraAnswered = eraEvents.filter(e => answeredSet.has(e.id));
    const info = ERA_INFO[era];
    return {
      era,
      ...info,
      total: eraEvents.length,
      answered: eraAnswered.length,
      percent: eraEvents.length > 0 ? Math.round((eraAnswered.length / eraEvents.length) * 100) : 0,
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your journey through history</Text>
        </Animated.View>

        {/* Overall Progress */}
        <Animated.View entering={FadeIn.duration(600).delay(150)}>
          <GlassCard style={styles.overallCard}>
            <View style={styles.overallHeader}>
              <MaterialIcons name="school" size={28} color={colors.orange500} />
              <View style={styles.overallText}>
                <Text style={styles.overallTitle}>Overall Progress</Text>
                <Text style={styles.overallSubtitle}>{answeredCount} of {totalEvents} events explored</Text>
              </View>
              <Text style={styles.overallPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Era Breakdown */}
        <Animated.View entering={FadeIn.duration(600).delay(300)}>
          <Text style={styles.sectionTitle}>By Era</Text>
        </Animated.View>

        {eraGroups.map((group, index) => (
          <Animated.View
            key={group.era}
            entering={SlideInRight.duration(400).delay(350 + index * 60)}
          >
            <GlassCard style={styles.eraCard}>
              <View style={styles.eraHeader}>
                <Text style={styles.eraEmoji}>{group.emoji}</Text>
                <View style={styles.eraInfo}>
                  <Text style={styles.eraName}>{group.name}</Text>
                  <Text style={styles.eraSpan}>{group.span}</Text>
                </View>
                <Text style={styles.eraCount}>{group.answered}/{group.total}</Text>
              </View>
              <View style={styles.eraProgressBg}>
                <View style={[styles.eraProgressFill, { width: `${group.percent}%` }]} />
              </View>
            </GlassCard>
          </Animated.View>
        ))}

        {/* Event List */}
        <Animated.View entering={FadeIn.duration(600).delay(800)}>
          <Text style={styles.sectionTitle}>All Events</Text>
        </Animated.View>

        {allHistoricalEvents
          .sort((a, b) => a.year - b.year)
          .map((event, index) => {
            const isAnswered = answeredSet.has(event.id);
            return (
              <View key={event.id} style={[styles.eventRow, !isAnswered && styles.eventRowLocked]}>
                <View style={[styles.eventDot, isAnswered && styles.eventDotAnswered]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, !isAnswered && styles.eventNameLocked]} numberOfLines={1}>
                    {event.name}
                  </Text>
                  <Text style={styles.eventYear}>
                    {event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}
                  </Text>
                </View>
                {isAnswered ? (
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                ) : (
                  <MaterialIcons name="lock-outline" size={18} color={colors.slate400} />
                )}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { paddingTop: 12, paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  overallCard: { marginBottom: 24 },
  overallHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  overallText: { flex: 1, marginLeft: 12 },
  overallTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  overallSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  overallPercent: { fontSize: 24, fontWeight: '700', color: colors.orange500 },
  progressBarBg: { height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.06)' },
  progressBarFill: { height: 10, borderRadius: 5, backgroundColor: colors.orange500 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  eraCard: { marginBottom: 10 },
  eraHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  eraEmoji: { fontSize: 24 },
  eraInfo: { flex: 1, marginLeft: 12 },
  eraName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  eraSpan: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  eraCount: { fontSize: 14, fontWeight: '600', color: colors.orange500 },
  eraProgressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)' },
  eraProgressFill: { height: 6, borderRadius: 3, backgroundColor: colors.orange400 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  eventRowLocked: { opacity: 0.5 },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate300, marginRight: 12 },
  eventDotAnswered: { backgroundColor: colors.success },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  eventNameLocked: { color: colors.textSecondary },
  eventYear: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
});
